import { useState, useCallback } from "react";
import { AlertButton } from "../components/CustomAlert";

export interface AlertOptions {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  type?: "default" | "warning" | "error" | "success";
  showCloseButton?: boolean;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: {},
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      visible: true,
      options,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState({
      visible: false,
      options: {},
    });
  }, []);

  // Convenience methods for common alert types
  const showConfirmAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = "Confirm",
      cancelText = "Cancel",
      type: "default" | "warning" | "error" | "success" = "default"
    ) => {
      showAlert({
        title,
        message,
        type,
        buttons: [
          {
            text: cancelText,
            onPress: onCancel,
            style: "cancel",
          },
          {
            text: confirmText,
            onPress: onConfirm,
            style: type === "error" ? "destructive" : "default",
          },
        ],
      });
    },
    [showAlert]
  );

  const showDeleteAlert = useCallback(
    (
      title: string,
      message: string,
      onDelete: () => void,
      onCancel?: () => void,
      deleteText = "Delete",
      cancelText = "Cancel"
    ) => {
      showAlert({
        title,
        message,
        type: "error",
        buttons: [
          {
            text: cancelText,
            onPress: onCancel,
            style: "cancel",
          },
          {
            text: deleteText,
            onPress: onDelete,
            style: "destructive",
          },
        ],
      });
    },
    [showAlert]
  );

  const showSuccessAlert = useCallback(
    (
      title: string,
      message: string,
      onOk?: () => void,
      okText = "OK"
    ) => {
      showAlert({
        title,
        message,
        type: "success",
        buttons: [
          {
            text: okText,
            onPress: onOk,
            style: "default",
          },
        ],
      });
    },
    [showAlert]
  );

  const showErrorAlert = useCallback(
    (
      title: string,
      message: string,
      onOk?: () => void,
      okText = "OK"
    ) => {
      showAlert({
        title,
        message,
        type: "error",
        buttons: [
          {
            text: okText,
            onPress: onOk,
            style: "default",
          },
        ],
      });
    },
    [showAlert]
  );

  return {
    showAlert,
    hideAlert,
    showConfirmAlert,
    showDeleteAlert,
    showSuccessAlert,
    showErrorAlert,
    alertState,
  };
};
