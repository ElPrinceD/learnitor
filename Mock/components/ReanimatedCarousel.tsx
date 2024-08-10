import React, { useState } from 'react';
import { StyleSheet, Image, Dimensions, View, Text, TouchableOpacity,useColorScheme, } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from '../constants/Colors';
import { SIZES, rMS } from "../constants";


interface CarouselItem {
  title: string;
  description: string;
  image: string;
}

interface ReanimatedCarouselProps {
  data: CarouselItem[];
}

const ReanimatedCarousel: React.FC<ReanimatedCarouselProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const colorMode = colorScheme === "dark" ? "dark" : "light";

  const styles = StyleSheet.create({
    carouselItem: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: themeColors.background,
      margin: 10,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'space-between',
    },
    textContainer: {
      position: 'absolute',
      top: 10,
      bottom: 10,
      right: 10,
      width: '45%', // Ensure it doesn't cross the middle
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      padding: 10,
    },
    button: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: themeColors.tint,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 5,
    },
    title: {
      fontSize: SIZES.xLarge,
      paddingTop: 10,
      textAlign: "center",
      fontWeight: 'bold',
      color: '#000',
      
    },
    description: {
      fontSize: SIZES.medium,
      color: 'white',
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    paginationDot: {
      width: 7,
      height: 7,
      borderRadius: 5,
      marginHorizontal: 1.5,
    },
    paginationDotActive: {
      backgroundColor: themeColors.tint,
    },
    paginationDotInactive: {
      backgroundColor: 'gray',
    },
    paginationDotActiveWidth: {
      width: 10, // Increased width for the active dot
    },
  });
  return (
    <View>
      <Carousel
        loop
        width={Dimensions.get('window').width * 0.95}
        height={Dimensions.get('window').width * 0.50}
        autoPlay={true}
        autoPlayInterval={3000}
        data={data}
        onSnapToItem={(index: number) => setCurrentIndex(index)}
        renderItem={({ item }: { item: CarouselItem }) => (
          <View style={styles.carouselItem}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.overlay}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.button}
                // onPress={() => navigation.navigate('CourseDetails')}
              >
                <Text style={styles.buttonText}>Go</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color= {themeColors.tint} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex ? styles.paginationDotActive : styles.paginationDotInactive,
              index === currentIndex && styles.paginationDotActiveWidth,
            ]}
          />
        ))}
      </View>
    </View>
  );
};



export default ReanimatedCarousel;
