const tintColor = "#c62828"; // Primary color (sunset red)
const tintColorSecond = '#ef5350'; // Lighter secondary color to complement the new main color
const gradientButton = 'linear-gradient(to right, #ef5350 0%, #c62828 100%)'; // New gradient button
const lightTextColor = '#000';
const lightTextSecondaryColor = '#666';
const lightBackgroundColor = '#fff'; // Keeping the original light background
const lightCardColor = '#ffebee'; // Light card color to complement the new main color
const lightBorderColor = '#c62828';
const lightShadowColor = '#000';
const lightTabIconDefaultColor = '#ccc';
const lightButtonDisabledColor = '#ff8a80'; // Light disabled button to complement the new main color
const lightPlaceholderColor = '#666';
const lightGradientBackgroundColor = '#f2f2f2'; // Keeping the original light gradient background
const darkTextColor = '#fff';
const darkTextSecondaryColor = '#ccc';
const darkBackgroundColor = '#000'; // Keeping the original dark background
const darkCardColor = '#8e0000'; // Dark card color to complement the new main color
const darkShadowColor = '#696969';
const darkTabIconDefaultColor = '#ccc';
const darkButtonDisabledColor = '#b71c1c'; // Dark disabled button to complement the new main color
const darkPlaceholderColor = '#aaa';
const darkGradientBackgroundColor = '#000';

const lightErrorBackground = '#f8d7da'; // Light red background
const lightErrorText = '#721c24'; // Dark red text
const darkErrorBackground = '#721c24'; // Dark red background
const darkErrorText = '#f8d7da'; // Light red text

// Export themes
export default {
  light: {
    text: lightTextColor,
    textSecondary: lightTextSecondaryColor,
    background: lightBackgroundColor,
    card: lightCardColor,
    tintSecond: tintColorSecond,
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
    gradientBackground: lightGradientBackgroundColor,
    errorBackground: lightErrorBackground,
    errorText: lightErrorText,
  },
  dark: {
    text: darkTextColor,
    textSecondary: darkTextSecondaryColor,
    tintSecond: tintColorSecond,
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
    gradientBackground: darkGradientBackgroundColor,
    errorBackground: darkErrorBackground,
    errorText: darkErrorText,
  },
};
