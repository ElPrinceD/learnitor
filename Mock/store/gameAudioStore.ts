import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const GAME_MUSIC_MUTED_KEY = 'game_music_muted';
const GAME_SOUND_MUTED_KEY = 'game_sound_muted';

// Local sound files
const MUSIC_SOURCE = require('../assets/sounds/music.mp3');
const CORRECT_SOURCE = require('../assets/sounds/correct.mp3');
const WRONG_SOURCE = require('../assets/sounds/wrong.mp3');

const LOAD_POLL_MS = 100;
const LOAD_TIMEOUT_MS = 5000;

// ── Types ──────────────────────────────────────────────────────────────
interface GameAudioState {
  musicMuted: boolean;
  soundMuted: boolean;
  loaded: boolean;

  // Actions
  setMusicMuted: (value: boolean) => void;
  setSoundMuted: (value: boolean) => void;
  playCorrect: () => void;
  playWrong: () => void;
  startMusic: () => void;
  stopMusic: () => void;
  /** Call once from a React effect to initialize audio players. */
  initAudio: () => () => void;
  /** Hydrate mute preferences from AsyncStorage. */
  _hydrateMutePrefs: () => void;
}

// ── Module-level audio player refs (not React refs) ────────────────────
let musicPlayer: AudioPlayer | null = null;
let correctPlayer: AudioPlayer | null = null;
let wrongPlayer: AudioPlayer | null = null;

// ── Store ──────────────────────────────────────────────────────────────
export const useGameAudioStore = create<GameAudioState>()((set, get) => ({
  musicMuted: false,
  soundMuted: false,
  loaded: false,

  _hydrateMutePrefs: () => {
    AsyncStorage.getItem(GAME_MUSIC_MUTED_KEY).then((stored) => {
      if (stored !== null) set({ musicMuted: JSON.parse(stored) });
    });
    AsyncStorage.getItem(GAME_SOUND_MUTED_KEY).then((stored) => {
      if (stored !== null) set({ soundMuted: JSON.parse(stored) });
    });
  },

  setMusicMuted: (value) => {
    set({ musicMuted: value });
    AsyncStorage.setItem(GAME_MUSIC_MUTED_KEY, JSON.stringify(value));
    if (value) {
      try { musicPlayer?.pause(); } catch {}
    }
  },

  setSoundMuted: (value) => {
    set({ soundMuted: value });
    AsyncStorage.setItem(GAME_SOUND_MUTED_KEY, JSON.stringify(value));
  },

  playCorrect: () => {
    const { soundMuted, loaded } = get();
    if (soundMuted || !loaded) return;
    try {
      if (correctPlayer) {
        correctPlayer.seekTo(0);
        correctPlayer.play();
      }
    } catch {}
  },

  playWrong: () => {
    const { soundMuted, loaded } = get();
    if (soundMuted || !loaded) return;
    try {
      if (wrongPlayer) {
        wrongPlayer.seekTo(0);
        wrongPlayer.play();
      }
    } catch {}
  },

  startMusic: () => {
    const { musicMuted, loaded } = get();
    if (musicMuted || !loaded) return;
    try {
      if (musicPlayer) {
        musicPlayer.loop = true;
        musicPlayer.seekTo(0);
        musicPlayer.play();
      }
    } catch {}
  },

  stopMusic: () => {
    try { musicPlayer?.pause(); } catch {}
  },

  initAudio: () => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
    }).then(() => {
      try {
        musicPlayer = createAudioPlayer(MUSIC_SOURCE);
        correctPlayer = createAudioPlayer(CORRECT_SOURCE);
        wrongPlayer = createAudioPlayer(WRONG_SOURCE);
      } catch {
        return;
      }

      const checkLoaded = () =>
        [musicPlayer, correctPlayer, wrongPlayer].every(
          (p) => p?.isLoaded === true
        );

      timeoutId = setTimeout(() => {
        set({ loaded: true });
      }, LOAD_TIMEOUT_MS);

      intervalId = setInterval(() => {
        if (checkLoaded()) {
          set({ loaded: true });
          if (intervalId != null) clearInterval(intervalId);
          if (timeoutId != null) clearTimeout(timeoutId);
        }
      }, LOAD_POLL_MS);
    });

    // Cleanup function — call on unmount
    return () => {
      if (intervalId != null) clearInterval(intervalId);
      if (timeoutId != null) clearTimeout(timeoutId);
      [musicPlayer, correctPlayer, wrongPlayer].forEach((p) => {
        try { p?.remove(); } catch {}
      });
      musicPlayer = null;
      correctPlayer = null;
      wrongPlayer = null;
      set({ loaded: false });
    };
  },
}));

// Hydrate mute prefs on module load
useGameAudioStore.getState()._hydrateMutePrefs();

// ── Backward-compatible hook ───────────────────────────────────────────
export const useGameAudio = () => {
  const store = useGameAudioStore();
  return {
    musicMuted: store.musicMuted,
    soundMuted: store.soundMuted,
    setMusicMuted: store.setMusicMuted,
    setSoundMuted: store.setSoundMuted,
    playCorrect: store.playCorrect,
    playWrong: store.playWrong,
    startMusic: store.startMusic,
    stopMusic: store.stopMusic,
  };
};
