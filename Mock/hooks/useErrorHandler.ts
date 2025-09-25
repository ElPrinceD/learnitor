import { useCallback } from "react";
import { useAlert } from "../contexts/AlertContext";

interface ErrorDetails {
  message?: string;
  code?: string | number;
  status?: number;
}

export const useErrorHandler = () => {
  const { showErrorAlert } = useAlert();

  const getUserFriendlyMessage = useCallback((error: any): string => {
    // Handle different error types
    if (typeof error === "string") {
      return error;
    }

    // Check for HTTP status codes first
    if (error?.response?.status) {
      const status = error.response.status;
      
      // 400 - Bad Request (validation errors)
      if (status === 400) {
        const responseData = error.response.data;
        if (responseData?.message) {
          const message = responseData.message.toLowerCase();
          
          // Check for specific validation errors
          if (message.includes("required") || message.includes("field") || message.includes("missing")) {
            return "Please fill in all required fields.";
          }
          if (message.includes("invalid") || message.includes("format")) {
            return "Please check your input and try again.";
          }
          if (message.includes("title") || message.includes("name")) {
            return "Please enter a valid title.";
          }
          if (message.includes("date") || message.includes("time")) {
            return "Please select a valid date and time.";
          }
          if (message.includes("email")) {
            return "Please enter a valid email address.";
          }
          if (message.includes("password")) {
            return "Please enter a valid password.";
          }
        }
        return "Please check your input and try again.";
      }
      
      // 401 - Unauthorized
      if (status === 401) {
        return "Please log in again to continue.";
      }
      
      // 403 - Forbidden
      if (status === 403) {
        return "You don't have permission to perform this action.";
      }
      
      // 404 - Not Found
      if (status === 404) {
        return "The requested item could not be found.";
      }
      
      // 409 - Conflict
      if (status === 409) {
        return "This item already exists. Please try a different name.";
      }
      
      // 422 - Unprocessable Entity
      if (status === 422) {
        return "Please check your input and try again.";
      }
      
      // 500 - Server Error
      if (status === 500) {
        return "Something went wrong on our end. Please try again later.";
      }
      
      // Other server errors
      if (status >= 500) {
        return "Something went wrong on our end. Please try again later.";
      }
    }

    if (error?.message) {
      const message = error.message.toLowerCase();
      
      // Network errors
      if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
        return "Please check your internet connection and try again.";
      }
      
      // Authentication errors
      if (message.includes("unauthorized") || message.includes("401")) {
        return "Please log in again to continue.";
      }
      
      // Permission errors
      if (message.includes("forbidden") || message.includes("403")) {
        return "You don't have permission to perform this action.";
      }
      
      // Not found errors
      if (message.includes("not found") || message.includes("404")) {
        return "The requested item could not be found.";
      }
      
      // Server errors
      if (message.includes("server") || message.includes("500")) {
        return "Something went wrong on our end. Please try again later.";
      }
      
      // Timeout errors
      if (message.includes("timeout")) {
        return "The request took too long. Please try again.";
      }
      
      // Validation errors
      if (message.includes("required") || message.includes("field") || message.includes("missing")) {
        return "Please fill in all required fields.";
      }
      
      // Return the original message if it seems user-friendly
      if (message.length < 100 && !message.includes("error") && !message.includes("exception")) {
        return error.message;
      }
    }

    // Default fallback
    return "Something went wrong. Please try again.";
  }, []);

  const handleError = useCallback((error: any, customTitle?: string) => {
    const message = getUserFriendlyMessage(error);
    const title = customTitle || "Error";
    
    showErrorAlert(title, message);
  }, [getUserFriendlyMessage, showErrorAlert]);

  const handleNetworkError = useCallback(() => {
    showErrorAlert(
      "Connection Error",
      "Please check your internet connection and try again."
    );
  }, [showErrorAlert]);

  const handleAuthError = useCallback(() => {
    showErrorAlert(
      "Session Expired",
      "Please log in again to continue."
    );
  }, [showErrorAlert]);

  const handleServerError = useCallback(() => {
    showErrorAlert(
      "Server Error",
      "Something went wrong on our end. Please try again later."
    );
  }, [showErrorAlert]);

  const handleValidationError = useCallback(() => {
    showErrorAlert(
      "Missing Information",
      "Please fill in all required fields."
    );
  }, [showErrorAlert]);

  const handleGenericError = useCallback(() => {
    showErrorAlert(
      "Something went wrong",
      "There was a problem. Please try again."
    );
  }, [showErrorAlert]);

  return {
    handleError,
    handleNetworkError,
    handleAuthError,
    handleServerError,
    handleValidationError,
    handleGenericError,
    getUserFriendlyMessage,
  };
};
