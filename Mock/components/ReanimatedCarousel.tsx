import React from 'react';
import { StyleSheet, Image, Dimensions, View, Text, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CarouselItem {
  title: string;
  description: string;
  image: string;
}

interface ReanimatedCarouselProps {
  data: CarouselItem[];
}

const ReanimatedCarousel: React.FC<ReanimatedCarouselProps> = ({ data }) => {
  return (
    <Carousel
      loop
      width={Dimensions.get('window').width * 0.95}
      height={Dimensions.get('window').width * 0.50}
      autoPlay={true}
      autoPlayInterval={3000}
      data={data}
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
              //   onPress={() => navigation.navigate('CourseDetails')}
            >
              <Text style={styles.buttonText}>Go</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  carouselItem: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
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
    padding: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000', // White text color for better readability
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'orange', // White text color for better readability
    textAlign: 'center',
  },
});

export default ReanimatedCarousel;
