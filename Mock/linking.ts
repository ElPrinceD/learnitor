export default {
    prefixes: ['myapp://', 'https://myapp.com'],
    config: {
      screens: {
        Intro: 'Intro',
        home: 'home',
        '(tabs)': {
          screens: {
            home: 'home',
            profile: 'profile',
            // Add your other tab routes
          },
        },
        '(verification)': '*',
        '(game)': '*',
        '(fullscreens)': '*',
      },
    },
  };
  