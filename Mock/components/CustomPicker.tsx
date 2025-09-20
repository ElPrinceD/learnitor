import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Select } from "@tamagui/select";
import { Adapt } from "@tamagui/adapt";
import { Sheet } from "@tamagui/sheet";
import type { SelectProps } from "@tamagui/select";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useColorScheme } from "../components/useColorScheme";
import Colors from "../constants/Colors";
import { rV, rS, rMS, SIZES } from "../constants";

interface CustomPickerProps extends SelectProps {
  label: string;
  selectedValue: string | undefined;
  onValueChange: (value: string) => void;
  options: string[];
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  options = [], // Default to an empty array
  ...selectProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row", // Change to row to place label and select side by side
      alignItems: "center",
      // paddingVertical: rV(10),
      justifyContent: "space-between", // Spread label and select apart
      // Removed border - was only meant for ContinueWithEmail page
    },
    label: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
      marginRight: rS(10), // Space between label and select
    },
    selectContainer: {
      flex: 1, // Allow the select to take up remaining space
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: rMS(20),
      borderTopRightRadius: rMS(20),
      paddingTop: rV(20),
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: rS(20),
      paddingBottom: rV(15),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.text,
    },
    modalTitle: {
      fontSize: SIZES.large,
      fontWeight: "bold",
      color: themeColors.text,
    },
    closeButton: {
      padding: rMS(5),
    },
    closeButtonText: {
      fontSize: SIZES.large,
      color: themeColors.text,
      fontWeight: "bold",
    },
    optionsContainer: {
      maxHeight: 300,
    },
    optionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: rV(15),
      paddingHorizontal: rS(20),
    },
    selectedOption: {
      backgroundColor: themeColors.tint + "20",
    },
    optionText: {
      fontSize: SIZES.medium,
      color: themeColors.text,
    },
    selectedOptionText: {
      color: themeColors.tint,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
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
              flex: 1, // Ensure the trigger takes up the full width of its container
              justifyContent: "flex-end",
            }}
          >
            <Select.Value
              style={{
                color: themeColors.text,
                fontWeight: "bold",
                fontSize: SIZES.medium,
              }}
              placeholder={`Select ${label.toLowerCase()}`}
            >
              {selectedValue || `Select ${label.toLowerCase()}`}
            </Select.Value>
          </Select.Trigger>

          <Modal
            visible={isOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select {label}</Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.optionsContainer}>
                  {options?.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionItem,
                        selectedValue === option && styles.selectedOption,
                      ]}
                      onPress={() => {
                        onValueChange(option);
                        setIsOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedValue === option && styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                      {selectedValue === option && (
                        <AntDesign
                          name="check-circle"
                          size={16}
                          color={themeColors.tint}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
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
                    fontWeight: "bold",
                    fontSize: SIZES.large,
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
                        fontSize: SIZES.medium,
                      }}
                    >
                      {option}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <AntDesign
                        name="check-circle"
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
