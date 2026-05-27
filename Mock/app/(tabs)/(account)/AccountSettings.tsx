import React, { useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { User, Mail, AtSign, GraduationCap } from "lucide-react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useAuth } from "../../../components/AuthContext";
import ApiUrl from "../../../config";
import axios from "axios";
import Colors from "../../../constants/Colors";
import { SIZES, rMS, rS, rV } from "../../../constants";
import { router } from "expo-router";
import { useAlert } from "../../../contexts/AlertContext";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InstitutionSelectField from "../../../components/signup/InstitutionSelectField";
import InstitutionPickerSheet, {
  InstitutionPickerSheetRef,
} from "../../../components/signup/InstitutionPickerSheet";
import { useUsernameAvailability } from "../../../hooks/useUsernameAvailability";
import type { Institution } from "../../../services/SignupApiCalls";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentInstitutionId } from "../../../utils/leaderboardProfile";
import {
  buildInstitutionUpdateFields,
  invalidateLeaderboardProfileQueries,
  mergeUserFromPatchResponse,
} from "../../../hooks/useInstitutionProfileSave";

const AccountSettings = () => {
  const { userInfo, userToken, setUserInformation, logout } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { showSuccessAlert, showDeleteAlert } = useAlert();
  const { handleError } = useErrorHandler();

  // ── Form state ───────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(
    userInfo?.user.first_name || ""
  );
  const [lastName, setLastName] = useState(userInfo?.user.last_name || "");
  const [email, setEmail] = useState(userInfo?.user.email || "");

  // Institution
  const initialInstitutionId = getCurrentInstitutionId(userInfo?.user);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(
      initialInstitutionId
        ? {
            id: initialInstitutionId,
            name: "School selected",
          }
        : null
    );
  const [schoolError, setSchoolError] = useState(false);

  // Username (re-uses the same availability hook as signup)
  const {
    username,
    onChangeUsername,
    setUsernameValue,
    errorText: usernameErrorText,
    isAvailable: usernameAvailable,
    isChecking: usernameChecking,
    status: usernameStatus,
  } = useUsernameAvailability();

  // Pre-populate username
  const [didHydrate] = useState(() => {
    if (userInfo?.user.username) {
      setUsernameValue(userInfo.user.username);
    }
    return true;
  });

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const institutionSheetRef = useRef<InstitutionPickerSheetRef>(null);

  // ── Helpers ──────────────────────────────────────────────────────────
  const usernameChanged =
    username.trim() !== (userInfo?.user.username || "");

  const openSchoolPicker = () => {
    institutionSheetRef.current?.present();
  };

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setSchoolError(false);
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleUpdateInfo = async () => {
    setGeneralError("");

    if (usernameChanged && !usernameAvailable) {
      setGeneralError("Please choose a valid, available username.");
      return;
    }

    setLoading(true);

    const config = {
      headers: {
        Authorization: `Token ${userToken?.token}`,
      },
    };

    // Only send fields that changed
    const updatedFields: Record<string, unknown> = {};
    if (firstName.trim() && firstName !== userInfo?.user.first_name)
      updatedFields.first_name = firstName.trim();
    if (lastName.trim() && lastName !== userInfo?.user.last_name)
      updatedFields.last_name = lastName.trim();
    if (email.trim() && email !== userInfo?.user.email)
      updatedFields.email = email.trim();
    if (usernameChanged && usernameAvailable)
      updatedFields.username = username.trim();
    if (selectedInstitution) {
      Object.assign(
        updatedFields,
        buildInstitutionUpdateFields(userInfo?.user, selectedInstitution)
      );
    }

    if (Object.keys(updatedFields).length === 0) {
      setLoading(false);
      showSuccessAlert("No Changes", "Nothing to update.", () => {});
      return;
    }

    try {
      const response = await axios.patch(
        `${ApiUrl}/api/update/user/${userInfo?.user.id}/`,
        updatedFields,
        config
      );

      if (userInfo) {
        const updated = mergeUserFromPatchResponse(
          userInfo,
          response.data,
          updatedFields,
          selectedInstitution
        );
        await setUserInformation(updated);

        if (selectedInstitution) {
          await invalidateLeaderboardProfileQueries(queryClient);
        }
      }

      showSuccessAlert("Success", "Your information has been updated.", () => {
        router.back();
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: Record<string, unknown> };
      };
      if (err.response?.status === 409) {
        if (err.response?.data?.username) {
          setGeneralError("Username is already in use.");
        } else if (err.response?.data?.email) {
          setGeneralError("An account with this email already exists.");
        } else {
          setGeneralError("A conflict occurred. Please check your info.");
        }
      } else {
        handleError(error, "Update Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    showDeleteAlert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      async () => {
        setLoading(true);

        const config = {
          headers: {
            Authorization: `Token ${userToken?.token}`,
          },
        };

        try {
          await axios.delete(`${ApiUrl}/api/delete-account/`, config);
          await AsyncStorage.multiRemove(["token", "user"]);
          logout();
          router.replace("/(verification)/Intro");
        } catch (error) {
          handleError(error, "Delete Account Failed");
          setLoading(false);
        }
      },
      () => {},
      "Delete",
      "Cancel"
    );
  };

  // ── Styles ───────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: rS(20),
      paddingTop: rV(20),
      paddingBottom: rV(20),
    },
    title: {
      fontSize: SIZES.xLarge,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: rV(20),
      alignSelf: "flex-start",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: rS(10),
    },
    halfWidth: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: rMS(16),
      paddingHorizontal: rS(14),
      paddingVertical: rV(2),
      marginBottom: rV(12),
      borderColor: themeColors.border + "40",
      backgroundColor: themeColors.cardGlass,
      width: "100%",
      minHeight: rV(48),
    },
    inputContainerError: {
      borderColor: "#D22B2B" + "60",
    },
    icon: {
      marginRight: rS(10),
      color: themeColors.textSecondary,
    },
    input: {
      flex: 1,
      height: rV(44),
      color: themeColors.text,
      fontSize: rMS(14),
      fontWeight: "500",
    },
    subTitle: {
      fontSize: rMS(14),
      fontWeight: "800",
      color: themeColors.text,
      marginTop: rV(20),
      marginBottom: rV(6),
      alignSelf: "flex-start",
      letterSpacing: -0.1,
    },
    subTitleHint: {
      fontSize: rMS(12),
      fontWeight: "500",
      color: themeColors.textSecondary,
      marginBottom: rV(10),
      alignSelf: "flex-start",
      lineHeight: rMS(18),
    },
    helperText: {
      fontSize: rMS(12),
      fontWeight: "600",
      marginTop: -rV(6),
      marginBottom: rV(10),
      paddingHorizontal: rS(4),
    },
    generalError: {
      fontSize: rMS(13),
      color: "#D22B2B",
      fontWeight: "600",
      textAlign: "center",
      marginTop: rV(4),
      marginBottom: rV(8),
    },
    footer: {
      paddingHorizontal: rS(16),
      paddingVertical: rV(12),
      backgroundColor: themeColors.background,
    },
    button: {
      borderRadius: rMS(24),
      paddingVertical: rV(14),
      alignItems: "center",
      backgroundColor: themeColors.tint,
      width: "100%",
    },
    buttonText: {
      color: "#fff",
      fontSize: rMS(14),
      fontWeight: "800",
    },
    deleteButton: {
      marginTop: rV(10),
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: "#DC2626" + "40",
    },
    deleteButtonText: {
      color: "#DC2626",
      fontSize: rMS(14),
      fontWeight: "700",
    },
  });

  const usernameHelperColor =
    usernameErrorText
      ? "#D22B2B"
      : usernameStatus === "available" && usernameChanged
        ? themeColors.tint
        : themeColors.textSecondary;

  const usernameHelperMessage = usernameErrorText
    ? usernameErrorText
    : !usernameChanged
      ? "Current username"
      : usernameStatus === "available"
        ? "That's available — you're good."
        : usernameStatus === "checking"
          ? "Checking if that's free..."
          : null;

  const usernameBorderError =
    !!usernameErrorText || usernameStatus === "invalid";

  return (
    <BottomSheetModalProvider>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Form fields scroll area */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Personal Info</Text>

          {/* First / Last Name */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <View style={styles.inputContainer}>
                <User
                  size={rMS(18)}
                  color={themeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.halfWidth}>
              <View style={styles.inputContainer}>
                <User
                  size={rMS(18)}
                  color={themeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Mail size={rMS(18)} color={themeColors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Username */}
          <Text style={styles.subTitle}>Username</Text>
          <Text style={styles.subTitleHint}>
            This is how you show up on leaderboards and squads.
          </Text>
          <View
            style={[
              styles.inputContainer,
              usernameBorderError && styles.inputContainerError,
            ]}
          >
            <AtSign
              size={rMS(18)}
              color={
                usernameBorderError
                  ? "#D22B2B"
                  : themeColors.textSecondary
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={onChangeUsername}
              placeholderTextColor={themeColors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {usernameHelperMessage ? (
            <Text
              style={[styles.helperText, { color: usernameHelperColor }]}
            >
              {usernameHelperMessage}
            </Text>
          ) : null}

          {/* School */}
          <Text style={styles.subTitle}>School</Text>
          <Text style={styles.subTitleHint}>
            Your school determines your regional ranking.
          </Text>
          <InstitutionSelectField
            selected={selectedInstitution}
            onPress={openSchoolPicker}
            hasError={schoolError}
            errorMessage="Please select your school."
            hint="Tap to find your campus"
          />

          {generalError ? (
            <Text style={styles.generalError}>{generalError}</Text>
          ) : null}
        </ScrollView>

        {/* Sticky footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdateInfo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <InstitutionPickerSheet
        ref={institutionSheetRef}
        onSelect={handleInstitutionSelect}
      />
    </BottomSheetModalProvider>
  );
};

export default AccountSettings;
