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
    padding: 16,
    marginBottom: 16,
    alignSelf: 'flex-start', // Aligns the container to the left
  },
  notificationContainer: {
    backgroundColor: '#fff',
    paddingLeft: "-70%",
    width: "100%",
    borderRadius: 10,
    borderColor: '#ccc', // Border color
    borderWidth: 1, // Border width
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 20,
    marginRight: 1,
  },
  content: {
    
    flexDirection: 'row',
    alignItems: 'flex-start',
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
