const tintColor = "#0D47A1"; // Primary dark blue color
const tintColorSecond = '#1565C0'; // Secondary dark blue color
const gradientButton = 'linear-gradient(to right, #1565C0 0%, #0D47A1 100%)'; // Dark blue gradient button
const lightTextColor = '#000';
const lightTextSecondaryColor = '#666';
const lightBackgroundColor = '#fff'; // Keeping the original light background
const lightCardColor = '#E3F2FD'; // Light blue card
const lightBorderColor = '#0D47A1';
const lightShadowColor = '#000';
const lightTabIconDefaultColor = '#ccc';
const lightButtonDisabledColor = '#B3E5FC'; // Light blue disabled button
const lightPlaceholderColor = '#666';
const lightGradientBackgroundColor = '#f2f2f2'; // Keeping the original light gradient background
const darkTextColor = '#fff';
const darkTextSecondaryColor = '#ccc';
const darkBackgroundColor = '#000'; // Keeping the original dark background
const darkCardColor = '#263238'; // Dark blue card
const darkShadowColor = '#696969';
const darkTabIconDefaultColor = '#ccc';
const darkButtonDisabledColor = '#003366'; // Dark blue disabled button
const darkPlaceholderColor = '#aaa';
const darkGradientBackgroundColor = '#000';




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
    gradientBackground: lightGradientBackgroundColor
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
    gradientBackground:darkGradientBackgroundColor
  },
};

