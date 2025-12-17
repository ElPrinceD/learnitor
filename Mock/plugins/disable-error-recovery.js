const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to disable Expo's Error Recovery
 * This prevents the app from crashing due to Expo's error recovery system
 */
const withDisableErrorRecovery = (config) => {
  return withInfoPlist(config, (config) => {
    // Disable Expo's error recovery
    config.modResults.EXErrorRecoveryEnabled = false;
    
    // Also try alternative keys that might work
    config.modResults.ExpoErrorRecoveryEnabled = false;
    config.modResults['EX_ERROR_RECOVERY_DISABLED'] = true;
    
    return config;
  });
};

module.exports = withDisableErrorRecovery;





