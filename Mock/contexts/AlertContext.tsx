import React, { createContext, useContext, ReactNode } from "react";
import CustomAlert from "../components/CustomAlert";
import { useCustomAlert, AlertOptions } from "../hooks/useCustomAlert";

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showConfirmAlert: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    type?: "default" | "warning" | "error" | "success"
  ) => void;
  showDeleteAlert: (
    title: string,
    message: string,
    onDelete: () => void,
    onCancel?: () => void,
    deleteText?: string,
    cancelText?: string
  ) => void;
  showSuccessAlert: (
    title: string,
    message: string,
    onOk?: () => void,
    okText?: string
  ) => void;
  showErrorAlert: (
    title: string,
    message: string,
    onOk?: () => void,
    okText?: string
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const {
    showAlert,
    hideAlert,
    showConfirmAlert,
    showDeleteAlert,
    showSuccessAlert,
    showErrorAlert,
    alertState,
  } = useCustomAlert();

  const contextValue: AlertContextType = {
    showAlert,
    hideAlert,
    showConfirmAlert,
    showDeleteAlert,
    showSuccessAlert,
    showErrorAlert,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        onDismiss={hideAlert}
        {...alertState.options}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
