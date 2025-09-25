import React from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAlert } from '../contexts/AlertContext';

interface IosOpenPdfExampleProps {
  url: string;
  filename: string;
}

const IosOpenPdfExample: React.FC<IosOpenPdfExampleProps> = ({ url, filename }) => {
  const { showErrorAlert } = useAlert();
  
  const openPdf = async () => {
    try {
      // Download PDF to document directory
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status === 200) {
        // Open PDF with sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Open PDF Document',
          });
        } else {
          showErrorAlert('Error', 'Sharing is not available on this device');
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      showErrorAlert('Error', 'Failed to download or open PDF. Please try again.');
    }
  };

  return null; // This component doesn't render anything
};

export default IosOpenPdfExample;
