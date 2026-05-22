import React, { memo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { rMS, rS, rV } from '../../constants';

interface Props {
  label: string;
  value: string;
  subtext?: string | null;
  fullWidth?: boolean;
  tall?: boolean;
}

const ProfileStatCard: React.FC<Props> = ({
  label,
  value,
  subtext,
  fullWidth,
  tall,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    card: {
      flex: fullWidth ? undefined : 1,
      width: fullWidth ? '100%' : undefined,
      backgroundColor: themeColors.card,
      borderRadius: rMS(24),
      padding: rMS(18),
      minHeight: tall ? rV(100) : rV(120),
      justifyContent: 'space-between',
    },
    label: {
      fontSize: rMS(9),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: themeColors.textSecondary,
    },
    value: {
      fontSize: rMS(26),
      fontWeight: '800',
      color: themeColors.text,
      letterSpacing: -0.5,
    },
    subtext: {
      fontSize: rMS(10),
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginTop: rV(4),
      lineHeight: rMS(14),
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {subtext ? (
          <Text style={styles.subtext} numberOfLines={2}>
            {subtext}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default memo(ProfileStatCard);
