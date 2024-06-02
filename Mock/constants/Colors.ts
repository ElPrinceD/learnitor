// Define color constants
const tintColor = '#097969';
const gradientButton = 'linear-gradient(to right, #447A7A 0%, #F9E866 100%)';
const lightTextColor = '#000';
const lightTextSecondaryColor = '#666';
const lightBackgroundColor = '#fff';
const lightCardColor = '#f7f2f2';
const lightBorderColor = '#097969';
const lightShadowColor = '#000';
const lightTabIconDefaultColor = '#ccc';
const lightButtonDisabledColor = '#ccffe5';
const lightPlaceholderColor = '#666';
const lightGradientBackgroundColor = '#f2f2f2'
const darkTextColor = '#fff';
const darkTextSecondaryColor = '#ccc';
const darkBackgroundColor = '#000';
const darkCardColor = '#181818';
const darkShadowColor = '#696969';
const darkTabIconDefaultColor = '#ccc';
const darkButtonDisabledColor = '#ccffe5';
const darkPlaceholderColor = '#aaa';
const darkGradientBackgroundColor = '#000'


// Export themes
export default {
  light: {
    text: lightTextColor,
    textSecondary: lightTextSecondaryColor,
    background: lightBackgroundColor,
    card: lightCardColor,
    tint: tintColor,
    border: lightBorderColor,
    shadow: lightShadowColor,
    tabIconDefault: lightTabIconDefaultColor,
    tabIconSelected: tintColor,
    buttonBackground: tintColor,
    buttonDisabled: lightButtonDisabledColor,
    placeholder: lightPlaceholderColor,
    icon: tintColor,
    selectedItem: tintColor,
    selectedText: tintColor,
    gradientBackground: lightGradientBackgroundColor
  },
  dark: {
    text: darkTextColor,
    textSecondary: darkTextSecondaryColor,
    background: darkBackgroundColor,
    card: darkCardColor,
    tint: tintColor,
    border: tintColor,
    shadow: darkShadowColor,
    tabIconDefault: darkTabIconDefaultColor,
    tabIconSelected: tintColor,
    buttonBackground: tintColor,
    buttonDisabled: darkButtonDisabledColor,
    placeholder: darkPlaceholderColor,
    icon: tintColor,
    selectedItem: tintColor,
    selectedText: tintColor,
    gradientBackground:darkGradientBackgroundColor
  },
};
