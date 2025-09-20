import React from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

interface AndroidOpenPdfExampleProps {
  url: string;
  filename: string;
}

const AndroidOpenPdfExample: React.FC<AndroidOpenPdfExampleProps> = ({ url, filename }) => {
  const openPdf = async () => {
    try {
      // Download PDF to document directory
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status === 200) {
        try {
          // Convert local file to content URI
          const contentUri = await FileSystem.getContentUriAsync(localUri);
          
          // Open PDF with intent launcher
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            type: 'application/pdf',
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });
        } catch (intentError) {
          console.error('Intent launcher failed, falling back to sharing:', intentError);
          
          // Fallback to sharing
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Open PDF Document',
            });
          } else {
            Alert.alert('Error', 'Unable to open PDF. Please install a PDF viewer app.');
          }
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

export default AndroidOpenPdfExample;
