const tintColorLight = '#8c6130';
const tintColorDark = '#8c6130';
const gradientButton = 'linear-gradient(to right, #447A7A 0%, #F9E866 100%)';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    buttonBackground: gradientButton,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    buttonBackground: gradientButton,
  },
};