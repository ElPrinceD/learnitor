import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GAME_MUSIC_MUTED_KEY = "game_music_muted";
const GAME_SOUND_MUTED_KEY = "game_sound_muted";

interface GameAudioContextType {
  musicMuted: boolean;
  setMusicMuted: (value: boolean) => void;
  soundMuted: boolean;
  setSoundMuted: (value: boolean) => void;
  playCorrect: () => void;
  playWrong: () => void;
  startMusic: () => void;
  stopMusic: () => void;
}

const GameAudioContext = createContext<GameAudioContextType | undefined>(
  undefined
);

// Local sound files in assets/sounds/
const MUSIC_SOURCE = require("../assets/sounds/music.mp3");
const CORRECT_SOURCE = require("../assets/sounds/correct.mp3");
const WRONG_SOURCE = require("../assets/sounds/wrong.mp3");

const LOAD_POLL_MS = 100;
const LOAD_TIMEOUT_MS = 5000;

export const GameAudioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [musicMuted, setMusicMutedState] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const musicRef = useRef<AudioPlayer | null>(null);
  const correctRef = useRef<AudioPlayer | null>(null);
  const wrongRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(GAME_MUSIC_MUTED_KEY).then((stored) => {
      if (stored !== null) setMusicMutedState(JSON.parse(stored));
    });
    AsyncStorage.getItem(GAME_SOUND_MUTED_KEY).then((stored) => {
      if (stored !== null) setSoundMutedState(JSON.parse(stored));
    });
  }, []);

  const setMusicMuted = useCallback((value: boolean) => {
    setMusicMutedState(value);
    AsyncStorage.setItem(GAME_MUSIC_MUTED_KEY, JSON.stringify(value));
  }, []);

  const setSoundMuted = useCallback((value: boolean) => {
    setSoundMutedState(value);
    AsyncStorage.setItem(GAME_SOUND_MUTED_KEY, JSON.stringify(value));
  }, []);

  useEffect(() => {
    const refs = [musicRef, correctRef, wrongRef];
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "duckOthers",
      shouldRouteThroughEarpiece: false,
    }).then(() => {
      try {
        musicRef.current = createAudioPlayer(MUSIC_SOURCE);
        correctRef.current = createAudioPlayer(CORRECT_SOURCE);
        wrongRef.current = createAudioPlayer(WRONG_SOURCE);
      } catch (_) {
        return;
      }

      const checkLoaded = () =>
        refs.every((r) => r.current?.isLoaded === true);

      timeoutId = setTimeout(() => {
        setLoaded(true);
      }, LOAD_TIMEOUT_MS);

      intervalId = setInterval(() => {
        if (checkLoaded()) {
          setLoaded(true);
          if (intervalId != null) clearInterval(intervalId);
          if (timeoutId != null) clearTimeout(timeoutId);
        }
      }, LOAD_POLL_MS);
    });

    return () => {
      if (intervalId != null) clearInterval(intervalId);
      if (timeoutId != null) clearTimeout(timeoutId);
      refs.forEach((ref) => {
        try {
          ref.current?.remove();
        } catch (_) {}
        ref.current = null;
      });
    };
  }, []);

  const playSound = useCallback(
    async (ref: React.MutableRefObject<AudioPlayer | null>) => {
      if (soundMuted || !loaded) return;
      try {
        const player = ref.current;
        if (player) {
          await player.seekTo(0);
          player.play();
        }
      } catch (_) {}
    },
    [soundMuted, loaded]
  );

  const playCorrect = useCallback(() => playSound(correctRef), [playSound]);
  const playWrong = useCallback(() => playSound(wrongRef), [playSound]);

  const startMusic = useCallback(async () => {
    if (musicMuted || !loaded) return;
    try {
      const player = musicRef.current;
      if (player) {
        player.loop = true;
        await player.seekTo(0);
        player.play();
      }
    } catch (_) {}
  }, [musicMuted, loaded]);

  const stopMusic = useCallback(() => {
    try {
      musicRef.current?.pause();
    } catch (_) {}
  }, []);

  // When musicMuted changes, stop if now muted
  useEffect(() => {
    if (musicMuted) stopMusic();
  }, [musicMuted, stopMusic]);

  return (
    <GameAudioContext.Provider
      value={{
        musicMuted,
        setMusicMuted,
        soundMuted,
        setSoundMuted,
        playCorrect,
        playWrong,
        startMusic,
        stopMusic,
      }}
    >
      {children}
    </GameAudioContext.Provider>
  );
};

export const useGameAudio = () => {
  const ctx = useContext(GameAudioContext);
  if (!ctx) {
    throw new Error("useGameAudio must be used within GameAudioProvider");
  }
  return ctx;
};
