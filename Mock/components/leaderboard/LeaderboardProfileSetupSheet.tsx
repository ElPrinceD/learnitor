import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Flag, School } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { rMS, rS, rV } from "../../constants";
import InstitutionSelectField from "../signup/InstitutionSelectField";
import InstitutionPickerSheet, {
  InstitutionPickerSheetRef,
} from "../signup/InstitutionPickerSheet";
import type { Institution } from "../../services/SignupApiCalls";
import { useInstitutionProfileSave } from "../../hooks/useInstitutionProfileSave";
import { useAuth } from "../../store/authStore";
import {
  getLeaderboardSetupCopy,
  type LeaderboardSetupVariant,
} from "../../utils/leaderboardProfile";

export interface LeaderboardProfileSetupSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  variant: LeaderboardSetupVariant;
  onDismiss?: () => void;
  onSuccess?: () => void;
}

const LeaderboardProfileSetupSheet = forwardRef<
  LeaderboardProfileSetupSheetRef,
  Props
>(({ variant, onDismiss, onSuccess }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const institutionSheetRef = useRef<InstitutionPickerSheetRef>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { userInfo } = useAuth();
  const { saveInstitution, loading, error, clearError } =
    useInstitutionProfileSave();

  const copy = getLeaderboardSetupCopy(variant, userInfo?.user);
  const IconComponent = variant === "country" ? Flag : School;
  const iconBg =
    variant === "country"
      ? (themeColors.tintSecond ?? themeColors.tint)
      : "#8b3b8f";

  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [pickedFromSearch, setPickedFromSearch] = useState(false);
  const [schoolError, setSchoolError] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const snapPoints = useMemo(() => ["58%"], []);

  useImperativeHandle(ref, () => ({
    present: () => {
      clearError();
      setLocalError(null);
      setSchoolError(false);
      setSelectedInstitution(null);
      setPickedFromSearch(false);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const openSchoolPicker = useCallback(() => {
    institutionSheetRef.current?.present();
  }, []);

  const handleInstitutionSelect = useCallback((institution: Institution) => {
    setSelectedInstitution(institution);
    setPickedFromSearch(true);
    setSchoolError(false);
    setLocalError(null);
    clearError();
  }, [clearError]);

  const handleSave = useCallback(async () => {
    if (!selectedInstitution || !pickedFromSearch) {
      setSchoolError(true);
      setLocalError("Search and select your school from the list.");
      return;
    }

    if (!selectedInstitution.country?.trim()) {
      setLocalError(
        "This school is missing country data. Try another school or contact support."
      );
      return;
    }

    const result = await saveInstitution(selectedInstitution);
    if (result.ok) {
      sheetRef.current?.dismiss();
      onSuccess?.();
      return;
    }

    if (result.reason === "no_changes") {
      setLocalError(
        "Nothing to update. Search and select your school again, then save."
      );
      return;
    }

    if (result.message) {
      setLocalError(result.message);
    }
  }, [onSuccess, pickedFromSearch, saveInstitution, selectedInstitution]);

  const displayError = localError ?? error;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          paddingHorizontal: rS(20),
          paddingTop: rV(8),
          paddingBottom: Math.max(insets.bottom, rV(16)) + rV(12),
        },
        iconCircle: {
          width: rMS(48),
          height: rMS(48),
          borderRadius: rMS(24),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBg + "20",
          alignSelf: "center",
          marginBottom: rV(12),
        },
        label: {
          fontSize: rMS(10),
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 3,
          color: themeColors.tint,
          textAlign: "center",
          marginBottom: rV(8),
        },
        title: {
          fontSize: rMS(18),
          fontWeight: "900",
          color: themeColors.text,
          textAlign: "center",
          marginBottom: rV(8),
        },
        body: {
          fontSize: rMS(13),
          fontWeight: "500",
          color: themeColors.textSecondary,
          textAlign: "center",
          lineHeight: rMS(20),
          marginBottom: rV(20),
        },
        fieldWrap: {
          alignItems: "center",
          marginBottom: rV(16),
        },
        errorText: {
          fontSize: rMS(12),
          fontWeight: "600",
          color: "#D22B2B",
          textAlign: "center",
          marginBottom: rV(12),
        },
        saveButton: {
          borderRadius: rMS(24),
          paddingVertical: rV(14),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: themeColors.tint,
          minHeight: rV(48),
        },
        saveButtonDisabled: {
          opacity: 0.6,
        },
        saveButtonText: {
          color: "#fff",
          fontSize: rMS(14),
          fontWeight: "800",
        },
      }),
    [iconBg, insets.bottom, themeColors]
  );

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        bottomInset={insets.bottom}
        backdropComponent={renderBackdrop}
        onDismiss={onDismiss}
        backgroundStyle={{
          backgroundColor: themeColors.background,
          borderRadius: rMS(28),
        }}
        handleIndicatorStyle={{
          backgroundColor: themeColors.textSecondary + "50",
          width: rS(40),
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Setup required</Text>
          <View style={styles.iconCircle}>
            <IconComponent size={24} color={iconBg} strokeWidth={1.75} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>

          <View style={styles.fieldWrap}>
            <InstitutionSelectField
              selected={selectedInstitution}
              onPress={openSchoolPicker}
              hasError={schoolError}
              hint="Search and tap your school in the list"
            />
          </View>

          {displayError ? (
            <Text style={styles.errorText}>{displayError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save school"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{copy.cta}</Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <InstitutionPickerSheet
        ref={institutionSheetRef}
        onSelect={handleInstitutionSelect}
      />
    </>
  );
});

LeaderboardProfileSetupSheet.displayName = "LeaderboardProfileSetupSheet";

export default memo(LeaderboardProfileSetupSheet);
