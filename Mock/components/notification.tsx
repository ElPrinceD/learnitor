import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Notification = ({ image, message, onPress }) => {
  return (
    <View style={[styles.container, styles.notificationContainer]}>
      <Image source={image} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.button} onPress={onPress}>Dismiss</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 1,
    marginBottom: 1,
    alignSelf: 'flex-start', // Aligns the container to the left
  },
  notificationContainer: {
    backgroundColor: '#fff',
    
    width: "100%",
    
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 1,
  },
  content: {
    
    flexDirection: 'row',
   
  },
  message: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    fontSize: 16,
    color: '#007bff',
    marginLeft: 16,
  },
});

export default Notification;
