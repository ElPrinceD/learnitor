import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Assuming Ionicons is being used

const Notification = ({ message }) => {
  return (
    <View style={[styles.container, styles.notificationContainer]}>
      <Icon name="notifications-outline" size={24} color="#333" style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContainer: {
    width: '100%',
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default Notification;
