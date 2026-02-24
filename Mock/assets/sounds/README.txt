Optional: place your 3 game sound files here to use them instead of default URLs:
- music.mp3   (main game music, plays while game is loading/playing)
- correct.mp3 (played when user selects right answer)
- wrong.mp3   (played when user selects wrong answer)

Then in Mock/contexts/GameAudioContext.tsx, load these with require("../assets/sounds/music.mp3") etc. and use them instead of SOUND_URLS.
