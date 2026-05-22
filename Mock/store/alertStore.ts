import { create } from 'zustand';

// ── Types (from hooks/useCustomAlert.ts) ───────────────────────────────
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'default' | 'warning' | 'error' | 'success';
  showCloseButton?: boolean;
}

interface AlertState {
  visible: boolean;
  options: AlertOptions;

  // Actions
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showConfirmAlert: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    type?: 'default' | 'warning' | 'error' | 'success'
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

// ── Store ──────────────────────────────────────────────────────────────
export const useAlertStore = create<AlertState>()((set) => ({
  visible: false,
  options: {},

  showAlert: (options) => set({ visible: true, options }),

  hideAlert: () => set({ visible: false, options: {} }),

  showConfirmAlert: (
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'default'
  ) =>
    set({
      visible: true,
      options: {
        title,
        message,
        type,
        buttons: [
          { text: cancelText, onPress: onCancel, style: 'cancel' },
          {
            text: confirmText,
            onPress: onConfirm,
            style: type === 'error' ? 'destructive' : 'default',
          },
        ],
      },
    }),

  showDeleteAlert: (
    title,
    message,
    onDelete,
    onCancel,
    deleteText = 'Delete',
    cancelText = 'Cancel'
  ) =>
    set({
      visible: true,
      options: {
        title,
        message,
        type: 'error',
        buttons: [
          { text: cancelText, onPress: onCancel, style: 'cancel' },
          { text: deleteText, onPress: onDelete, style: 'destructive' },
        ],
      },
    }),

  showSuccessAlert: (title, message, onOk, okText = 'OK') =>
    set({
      visible: true,
      options: {
        title,
        message,
        type: 'success',
        buttons: [{ text: okText, onPress: onOk, style: 'default' }],
      },
    }),

  showErrorAlert: (title, message, onOk, okText = 'OK') =>
    set({
      visible: true,
      options: {
        title,
        message,
        type: 'error',
        buttons: [{ text: okText, onPress: onOk, style: 'default' }],
      },
    }),
}));

// ── Backward-compatible hook ───────────────────────────────────────────
export const useAlert = () => {
  const store = useAlertStore();
  return {
    showAlert: store.showAlert,
    hideAlert: store.hideAlert,
    showConfirmAlert: store.showConfirmAlert,
    showDeleteAlert: store.showDeleteAlert,
    showSuccessAlert: store.showSuccessAlert,
    showErrorAlert: store.showErrorAlert,
  };
};
