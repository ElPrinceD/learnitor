import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  Image,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Platform,
} from "react-native";

// Lazy load Carousel to handle potential initialization errors
let Carousel: any = null;
try {
  const carouselModule = require("react-native-reanimated-carousel");
  Carousel = carouselModule?.default || carouselModule;
  if (!Carousel || typeof Carousel !== "function") {
    console.warn("Carousel component is not available");
    Carousel = null;
  }
} catch (error) {
  console.warn("Failed to load react-native-reanimated-carousel:", error);
  Carousel = null;
}
import Colors from "../constants/Colors";
import { SIZES, rMS } from "../constants";
import NativeAdComponent from "./ads/NativeAd";
import { AD_CONFIG } from "../config/AdConfig";

interface CarouselItem {
  title: string;
  description: string;
  image: string;
  isAd?: boolean;
}

interface ReanimatedCarouselWithAdsProps {
  data: CarouselItem[];
}

const ReanimatedCarouselWithAds: React.FC<ReanimatedCarouselWithAdsProps> = ({
  data,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Don't render if no data
  if (!data || data.length === 0) {
    return null;
  }

  // Inject ads into the carousel data
  const dataWithAds = useMemo(() => {
    const itemsWithAds: CarouselItem[] = [];

    data.forEach((item, index) => {
      itemsWithAds.push(item);

      // Add ad every AD_FREQUENCY items
      if ((index + 1) % AD_CONFIG.CAROUSEL_AD_FREQUENCY === 0) {
        itemsWithAds.push({
          title: "Advertisement",
          description: "",
          image: "",
          isAd: true,
        });
      }
    });

    return itemsWithAds;
  }, [data]);

  const styles = StyleSheet.create({
    carouselItem: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: themeColors.background,
      margin: 10,
      overflow: "hidden",
      height: 240,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
      padding: 15,
    },
    title: {
      fontSize: rMS(18),
      fontWeight: "bold",
      color: "white",
      marginBottom: 5,
    },
    description: {
      fontSize: rMS(14),
      color: "white",
    },
    adContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "stretch",
      paddingHorizontal: 0,
      paddingVertical: 0,
      margin: 0,
      width: "100%",
      height: "100%",
      backgroundColor: themeColors.background,
      minHeight: 0,
    },
  });

  const renderItem = ({ item }: { item: CarouselItem }) => {
    if (item.isAd) {
      return (
        <View style={styles.adContainer} pointerEvents="box-none">
          <NativeAdComponent placement="carousel" />
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.carouselItem}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.overlay}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Fallback to ScrollView if Carousel is not available
  if (!Carousel) {
    return (
      <View style={{ height: 250 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ height: 250 }}
        >
          {dataWithAds.map((item, index) => (
            <View key={index} style={{ width: Dimensions.get("window").width }}>
              {renderItem({ item })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Ensure carousel starts auto-playing on mount, especially for iOS
  useEffect(() => {
    if (carouselRef.current && Platform.OS === "ios") {
      // Small delay to ensure carousel is fully mounted on iOS
      const timer = setTimeout(() => {
        if (carouselRef.current) {
          // Force carousel to start auto-play on iOS
          carouselRef.current.scrollTo({ index: 0, animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dataWithAds.length]);

  return (
    <View style={{ height: 250 }}>
      <Carousel
        ref={carouselRef}
        data={dataWithAds}
        renderItem={renderItem}
        width={Dimensions.get("window").width}
        height={250}
        onSnapToItem={(index) => setCurrentIndex(index)}
        autoPlay={true}
        autoPlayInterval={5000}
        loop={true}
        enabled={true}
        autoPlayReverse={false}
        windowSize={3}
        panGestureHandlerProps={{
          activeOffsetX: Platform.OS === "ios" ? [-5, 5] : [-10, 10],
        }}
      />
    </View>
  );
};

export default ReanimatedCarouselWithAds;
