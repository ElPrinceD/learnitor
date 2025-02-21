const tintColor = "#0D47A1"; // Primary dark blue color
const tintColorSecond = '#1565C0'; // Secondary dark blue color
const gradientButton = 'linear-gradient(to right, #1565C0 0%, #0D47A1 100%)'; // Dark blue gradient button
const lightTextColor = '#000';
const lightTextSecondaryColor = '#666';
const lightBackgroundColor = '#f0f1f2'; // Keeping the original light background
const lightSecondaryBackground = '#fcfcfc';
const lightCardColor = '#E3F2FD'; // Light blue card
const lightBorderColor = '#0D47A1';
const lightShadowColor = '#000';
const lightTabIconDefaultColor = '#ccc';
const lightButtonDisabledColor = '#B3E5FC'; // Light blue disabled button
const lightPlaceholderColor = '#666';
const lightGradientBackgroundColor = '#f2f2f2'; // Keeping the original light gradient background
const darkTextColor = '#fff';
const darkTextSecondaryColor = '#ccc';
const darkBackgroundColor = '#18191a'; // Keeping the original dark background
const darkSecondaryBackground = '#1e1e1f'
const darkCardColor = '#263238'; // Dark blue card
const darkShadowColor = '#696969';
const darkTabIconDefaultColor = '#ccc';
const darkButtonDisabledColor = '#003366'; // Dark blue disabled button
const darkPlaceholderColor = '#aaa';
const darkGradientBackgroundColor = '#000';
const darkGrey = "#212121";
const lightGrey = "#dedee0";

const lightErrorBackground = '#f8d7da'; // Light red background
const lightErrorText = '#721c24'; // Dark red text
const darkErrorBackground = '#721c24'; // Dark red background
const darkErrorText = '#f8d7da'; // Light red text

// Export themes
export default {
  light: {
    text: lightTextColor,
    reverseText: lightGrey,
    reverseGrey: darkGrey,
    normalGrey: darkTextColor,
    textSecondary: lightTextSecondaryColor,
    background: lightBackgroundColor,
    card: lightCardColor,
    tintSecond: tintColorSecond,
    tint: tintColor,
    border: lightBorderColor,
    shadow: lightShadowColor,
    secondaryBackground: lightSecondaryBackground,
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
    reverseText: darkGrey,
    normalGrey: lightGrey,
    reverseGrey: lightGrey,
    textSecondary: darkTextSecondaryColor,
    secondaryBackground: darkSecondaryBackground,
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