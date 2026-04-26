const tintColor = "#0D47A1"; // Primary dark blue color
const tintColorSecond = '#1565C0'; // Secondary dark blue color
const gradientButton = 'linear-gradient(to right, #1565C0 0%, #0D47A1 100%)'; // Dark blue gradient button

// ─── Light palette ───
const lightTextColor = '#0A0F1E';
const lightTextSecondaryColor = '#6B7280';
const lightBackgroundColor = '#F5F6FA';
const lightSecondaryBackground = '#EBEDF5';
const lightCardColor = '#FFFFFF';
const lightCardGlassColor = 'rgba(255,255,255,0.72)';
const lightSurfaceOverlayColor = 'rgba(255,255,255,0.55)';
const lightBorderColor = '#D8DEE9';
const lightShadowColor = 'rgba(0,0,0,0.08)';
const lightTabIconDefaultColor = '#ccc';
const lightButtonDisabledColor = '#B3E5FC';
const lightPlaceholderColor = '#9CA3AF';
const lightGradientBackgroundColor = '#f2f2f2';

// ─── Dark palette ───
const darkTextColor = '#F0F2F5';
const darkTextSecondaryColor = '#8B95A5';
const darkBackgroundColor = '#0F1117';
const darkSecondaryBackground = '#181D27';
const darkCardColor = '#1E2733';
const darkCardGlassColor = 'rgba(30,39,51,0.72)';
const darkSurfaceOverlayColor = 'rgba(30,39,51,0.55)';
const darkBorderColor = '#2A3545';
const darkShadowColor = 'rgba(0,0,0,0.35)';
const darkTabIconDefaultColor = '#ccc';
const darkButtonDisabledColor = '#003366';
const darkPlaceholderColor = '#6B7280';
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
    cardGlass: lightCardGlassColor,
    surfaceOverlay: lightSurfaceOverlayColor,
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
    cardGlass: darkCardGlassColor,
    surfaceOverlay: darkSurfaceOverlayColor,
    tint: tintColor,
    border: darkBorderColor,
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