import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
} from "react-native";
import { Select } from "@tamagui/select";
import type { SelectProps } from "@tamagui/select";
import { CheckCircle2, X } from "lucide-react-native";
import { useColorScheme } from "../components/useColorScheme";
import Colors from "../constants/Colors";
import { rV, rS, rMS, SIZES } from "../constants";

interface CustomPickerProps extends SelectProps {
  label: string;
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  options = [],
  placeholder,
  ...selectProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const highlightColor =
    colorScheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      fontSize: rMS(13),
      color: themeColors.text,
      fontWeight: "700",
      marginRight: rS(10),
    },
    selectContainer: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(24),
      borderTopRightRadius: rMS(24),
      paddingTop: rV(8),
      maxHeight: "70%",
    },
    modalHandle: {
      width: rS(36),
      height: 4,
      borderRadius: 2,
      backgroundColor: themeColors.border + "60",
      alignSelf: "center",
      marginBottom: rV(12),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(20),
      paddingBottom: rV(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border + "30",
    },
    modalTitle: {
      fontSize: rMS(15),
      fontWeight: "800",
      color: themeColors.text,
      letterSpacing: -0.2,
    },
    closeButton: {
      width: rMS(28),
      height: rMS(28),
      borderRadius: rMS(14),
      backgroundColor: themeColors.border + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    optionsContainer: {
      maxHeight: 300,
    },
    optionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(14),
      paddingHorizontal: rS(20),
    },
    selectedOption: {
      backgroundColor: themeColors.tint + "10",
    },
    optionText: {
      fontSize: rMS(14),
      color: themeColors.text,
      fontWeight: "500",
    },
    selectedOptionText: {
      color: themeColors.tint,
      fontWeight: "700",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border + "20",
      marginLeft: rS(20),
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.selectContainer}>
        <Select
          value={selectedValue}
          onValueChange={onValueChange}
          open={isOpen}
          onOpenChange={setIsOpen}
          disablePreventBodyScroll
          {...selectProps}
        >
          <Select.Trigger
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
              borderWidth: 0,
              borderTopWidth: 0,
              borderBottomWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderRadius: rMS(6),
              paddingVertical: rV(12),
              paddingHorizontal: rS(16),
              zIndex: 10,
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <Select.Value
              style={{
                color: selectedValue
                  ? themeColors.text
                  : themeColors.textSecondary,
                fontWeight: selectedValue ? "700" : "500",
                fontSize: rMS(13),
                textAlign: "right",
              }}
              placeholder={placeholder || `Select ${label.toLowerCase()}`}
            >
              {selectedValue || placeholder || `Select ${label.toLowerCase()}`}
            </Select.Value>
          </Select.Trigger>

          <Modal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsOpen(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select {label}</Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <X size={14} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.optionsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {options?.map((option, index) => (
                    <React.Fragment key={option}>
                      <TouchableHighlight
                        underlayColor={highlightColor}
                        style={[
                          styles.optionItem,
                          selectedValue === option && styles.selectedOption,
                        ]}
                        onPress={() => {
                          onValueChange(option);
                          setIsOpen(false);
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text
                            style={[
                              styles.optionText,
                              selectedValue === option &&
                                styles.selectedOptionText,
                            ]}
                          >
                            {option}
                          </Text>
                          {selectedValue === option && (
                            <CheckCircle2
                              size={18}
                              color={themeColors.tint}
                            />
                          )}
                        </View>
                      </TouchableHighlight>
                      {index < options.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          <Select.Content>
            <Select.Viewport
              animation="quick"
              animateOnly={["transform", "opacity"]}
              enterStyle={{ opacity: 0, y: -10 }}
              exitStyle={{ opacity: 0, y: 10 }}
            >
              <Select.Group>
                <Select.Label
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
                    fontWeight: "800",
                    fontSize: rMS(14),
                  }}
                >
                  Options
                </Select.Label>
                {options?.map((option, index) => (
                  <Select.Item
                    key={option}
                    index={index}
                    value={option}
                    backgroundColor={themeColors.background}
                  >
                    <Select.ItemText
                      style={{
                        color: themeColors.textSecondary,
                        fontSize: rMS(13),
                      }}
                    >
                      {option}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <CheckCircle2
                        size={16}
                        color={themeColors.tint}
                      />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select>
      </View>
    </View>
  );
};

export default CustomPicker;
