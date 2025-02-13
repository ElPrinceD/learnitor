
import React, { useEffect, useState } from 'react';
import FastImage from 'react-native-fast-image';

interface PreloadImageProps {
  source: { uri: string };
  style?: any;
  [x: string]: any; // For passing additional props to FastImage
}

const PreloadImage: React.FC<PreloadImageProps> = ({ source, style, ...otherProps }) => {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    FastImage.preload([source]);
    setIsPreloaded(true);
  }, [source.uri]);

  return (
    <FastImage
      source={source}
      style={[style, !isPreloaded && { opacity: 0 }]}  // Optionally show a placeholder until preloaded
      {...otherProps}
    />
  );
};

export default PreloadImage;