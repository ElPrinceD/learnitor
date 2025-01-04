import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
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
      flex: 1,
      paddingVertical: rV(10),
    },
    label: {
      fontSize: SIZES.large,
      marginBottom: rV(8),
      color: themeColors.text,
      fontWeight: "bold",
    },
  });

  return (
    <View style={[styles.container, { zIndex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
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
            backgroundColor: colorScheme === "light" ? "#EEEEEE" : "#3A3B3C",
            borderColor: "transparent",
            borderRadius: rMS(6),
            paddingVertical: rV(12),
            paddingHorizontal: rS(16),
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

        <Adapt when={true} platform="touch">
          <Sheet
            native={!!selectProps.native}
            modal
            dismissOnSnapToBottom
            open={isOpen}
            onOpenChange={setIsOpen}
            animationConfig={{
              type: "spring",
              damping: 22,
              mass: 1.2,
              stiffness: 220,
            }}
            snapPoints={[40]}
          >
            <Sheet.Frame
              style={{
                backgroundColor: themeColors.background,
              }}
            >
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

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
                      name="checkcircleo"
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
  );
};

export default CustomPicker;
