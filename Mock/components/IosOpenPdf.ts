import React from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface IosOpenPdfExampleProps {
  url: string;
  filename: string;
}

const IosOpenPdfExample: React.FC<IosOpenPdfExampleProps> = ({ url, filename }) => {
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
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to download or open PDF. Please try again.');
    }
  };

  return null; // This component doesn't render anything
};

export default IosOpenPdfExample;
