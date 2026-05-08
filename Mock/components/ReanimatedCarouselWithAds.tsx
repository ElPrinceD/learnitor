import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Image,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
// Icons handled by Lucide
import Colors from "../constants/Colors";
import { SIZES, rMS, rS, rV } from "../constants";
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

  const screenWidth = Dimensions.get("window").width;

  const styles = StyleSheet.create({
    wrapper: {
      marginBottom: rV(4),
    },
    carouselItem: {
      flex: 1,
      borderRadius: rMS(20),
      backgroundColor: themeColors.cardGlass,
      marginHorizontal: rS(6),
      overflow: "hidden",
      height: 220,
      borderWidth: 1,
      borderColor: themeColors.border + "40",
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
      justifyContent: "flex-end",
      padding: rMS(16),
    },
    overlayGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "60%",
      backgroundColor: "transparent",
    },
    title: {
      fontSize: rMS(16),
      fontWeight: "800",
      color: "white",
      marginBottom: rV(4),
      letterSpacing: -0.2,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    description: {
      fontSize: rMS(12),
      color: "rgba(255,255,255,0.85)",
      fontWeight: "600",
      lineHeight: rMS(16),
      textShadowColor: "rgba(0,0,0,0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
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
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(20),
      minHeight: 0,
    },
    // Pagination dots
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: rV(10),
    },
    paginationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 3,
    },
    paginationDotActive: {
      backgroundColor: themeColors.tint,
      width: 18,
      borderRadius: 4,
    },
    paginationDotInactive: {
      backgroundColor: themeColors.textSecondary + "40",
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
      <TouchableOpacity style={styles.carouselItem} activeOpacity={0.9}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.overlay}>
          {/* Dark gradient at bottom for text readability */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "65%",
              borderBottomLeftRadius: rMS(20),
              borderBottomRightRadius: rMS(20),
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />
          <View style={{ zIndex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Carousel
        data={dataWithAds}
        renderItem={renderItem}
        width={screenWidth}
        height={230}
        onSnapToItem={(index) => setCurrentIndex(index)}
        autoPlay={true}
        autoPlayInterval={6000}
        loop={true}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
      />
      {dataWithAds.length > 1 && (
        <View style={styles.paginationContainer}>
          {dataWithAds.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ReanimatedCarouselWithAds;
