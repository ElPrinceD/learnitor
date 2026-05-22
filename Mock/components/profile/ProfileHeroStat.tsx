import React, { memo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { rMS, rS, rV } from '../../constants';

interface Props {
  label: string;
  value: string;
  subtext?: string;
  rightLabel?: string;
  rightBadge?: string;
  Icon?: LucideIcon;
}

const ProfileHeroStat: React.FC<Props> = ({
  label,
  value,
  subtext,
  rightLabel,
  rightBadge,
  Icon,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    card: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(24),
      padding: rMS(20),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    label: {
      fontSize: rMS(9),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: '#fff',
      opacity: 0.8,
      marginBottom: rV(4),
    },
    value: {
      fontSize: rMS(36),
      fontWeight: '800',
      color: '#fff',
      letterSpacing: -1.5,
    },
    subtext: {
      fontSize: rMS(10),
      fontWeight: '600',
      color: '#fff',
      opacity: 0.85,
      marginTop: rV(4),
    },
    right: {
      alignItems: 'flex-end',
      maxWidth: '40%',
    },
    badge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: rV(4),
      paddingHorizontal: rMS(10),
      borderRadius: rMS(8),
    },
    badgeText: {
      fontSize: rMS(11),
      fontWeight: '700',
      color: '#fff',
    },
    iconOverlay: {
      position: 'absolute',
      right: -rS(8),
      bottom: -rV(8),
      opacity: 0.08,
    },
  });

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
      {(rightLabel || rightBadge) && (
        <View style={styles.right}>
          {rightLabel ? <Text style={styles.label}>{rightLabel}</Text> : null}
          {rightBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {rightBadge}
              </Text>
            </View>
          ) : null}
        </View>
      )}
      {Icon ? (
        <View style={styles.iconOverlay}>
          <Icon size={100} color="#fff" />
        </View>
      ) : null}
    </View>
  );
};

export default memo(ProfileHeroStat);
