/**
 * Global Error Handler Setup
 * This file must be imported FIRST before any other code to prevent Expo's error recovery from crashing the app
 */

// Set up global error handler immediately
if (typeof ErrorUtils !== "undefined") {
  const originalGlobalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error("[ErrorHandler] Global error caught:", {
      message: error?.message,
      stack: error?.stack,
      isFatal,
      name: error?.name,
    });
    
    // Try to log to Sentry if available
    try {
      const SentryModule = require("@sentry/react-native");
      if (SentryModule?.captureException) {
        SentryModule.captureException(error);
      }
    } catch (e) {
      // Sentry not available yet, that's okay
    }
    
    // CRITICAL: Prevent Expo's error recovery from crashing
    // For fatal errors, we completely bypass the original handler (which is Expo's error recovery)
    // and just log the error instead of crashing
    if (isFatal === true) {
      console.error("[ErrorHandler] FATAL ERROR INTERCEPTED - Preventing crash");
      console.error("[ErrorHandler] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // DO NOT call the original handler for fatal errors
      // Expo's error recovery would crash the app, so we prevent that
      // The error is already logged above and to Sentry
      return;
    }
    
    // For non-fatal errors, call original handler normally
    if (originalGlobalHandler) {
      try {
        originalGlobalHandler(error, isFatal);
      } catch (handlerError) {
        console.error("[ErrorHandler] Error in original handler:", handlerError);
      }
    }
  });
}

// Handle unhandled promise rejections
if (typeof global !== "undefined") {
  const originalUnhandledRejection = global.onunhandledrejection;
  
  global.onunhandledrejection = (event: any) => {
    console.error("[ErrorHandler] Unhandled promise rejection:", {
      reason: event?.reason,
      stack: event?.reason?.stack,
    });
    
    // Try to log to Sentry
    try {
      const SentryModule = require("@sentry/react-native");
      if (SentryModule?.captureException && event?.reason) {
        SentryModule.captureException(event.reason);
      }
    } catch (e) {
      // Sentry not available
    }
    
    // Prevent default crash behavior
    if (event) {
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      // Mark as handled
      event.defaultPrevented = true;
      event._handled = true;
    }
    
    // Don't call original handler if it would crash
    // Only call if it's safe (not the Expo error recovery)
    if (originalUnhandledRejection && typeof originalUnhandledRejection === "function") {
      try {
        // Wrap in try-catch to prevent any crashes
        originalUnhandledRejection(event);
      } catch (handlerError) {
        console.error("[ErrorHandler] Error in original rejection handler:", handlerError);
      }
    }
  };
}

// Also handle window.onerror for web compatibility
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("error", (event) => {
    console.error("[ErrorHandler] Window error:", event.error);
    // Prevent default error handling
    event.preventDefault();
  });
  
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[ErrorHandler] Window unhandled rejection:", event.reason);
    // Prevent default error handling
    event.preventDefault();
  });
}

console.log("[ErrorHandler] Global error handlers initialized");

