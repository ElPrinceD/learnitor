import React, { memo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { rMS, rV } from '../../constants';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const ProfileInsightSection: React.FC<Props> = ({
  title,
  subtitle,
  children,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    wrap: {
      marginBottom: rV(24),
    },
    header: {
      marginBottom: rV(12),
    },
    title: {
      fontSize: rMS(16),
      fontWeight: '800',
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: rMS(11),
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginTop: rV(2),
    },
    body: {
      gap: rV(12),
    },
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

export default memo(ProfileInsightSection);
