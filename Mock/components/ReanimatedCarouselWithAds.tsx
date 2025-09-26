import React, { useState, useMemo, useEffect } from "react";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Don't render if no data
  if (!data || data.length === 0) {
    console.log("No carousel data available");
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
          <NativeAdComponent
            placement="carousel"
            onAdLoaded={() => console.log("Carousel native ad loaded")}
            onAdFailedToLoad={(error) =>
              console.log("Carousel native ad failed:", error)
            }
          />
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

  return (
    <View style={{ height: 250 }}>
      <Carousel
        data={dataWithAds}
        renderItem={renderItem}
        width={Dimensions.get("window").width}
        height={250}
        onSnapToItem={(index) => setCurrentIndex(index)}
        autoPlay={true}
        autoPlayInterval={6000}
        loop={true}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
      />
    </View>
  );
};

export default ReanimatedCarouselWithAds;
