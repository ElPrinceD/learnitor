import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import Colors from "../constants/Colors";
import { rMS, rS, rV } from '../constants';

const TimetableItem = ({ plan, onPress }) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Use a default color scheme for the card based on the plan name.
  const cardColor = plan.name === "Human Biology 1" ? '#E0F7FA' : '#F0F4C3';

  return (
    <TouchableOpacity
      style={[styles.planItemWrapper, { backgroundColor: cardColor }]}
      onPress={() => onPress(plan)}
    >
      {/* Logo Section (instead of date info) */}
      <View style={styles.logoWrapper}>
        <Image source={{ uri: plan.logo }} style={styles.logo} />
      </View>
      {/* Details Section */}
      <View style={styles.detailsWrapper}>
        <Text style={[styles.eventName, { color: themeColors.background }]}>{plan.name}</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>{plan.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planItemWrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logo: {
    width: rS(50),
    height: rV(50),
    borderRadius: rMS(25), // Makes the logo circular
  },
  detailsWrapper: {
    flex: 1,
    justifyContent: 'center', // Vertically center the title and description
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
});

export default TimetableItem;
