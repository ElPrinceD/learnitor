import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import ApiUrl from "../../config";
import { rMS, rS, rV, useShadows } from "../../constants";
import Colors from "../../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Typewriter } from "../../components/TypewriterText";
import AnimatedTextInput from "../../components/AnimatedTextInput";
import ScreenLoadingSpinner from "../../components/ScreenLoadingSpinner";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { UserPlus, AtSign, School, ArrowLeft } from "lucide-react-native";
import InstitutionSelectField from "../../components/signup/InstitutionSelectField";
import InstitutionPickerSheet, {
  InstitutionPickerSheetRef,
} from "../../components/signup/InstitutionPickerSheet";
import SignupStepIndicator from "../../components/signup/SignupStepIndicator";
import { useUsernameAvailability } from "../../hooks/useUsernameAvailability";
import {
  clearSignupDraft,
  loadSignupDraft,
  useSignupDraftPersistence,
  type SignupStep,
} from "../../hooks/useSignupDraft";
import type { Institution } from "../../services/SignupApiCalls";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ContinueWithEmail = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<SignupStep>(1);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [schoolError, setSchoolError] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [surnameError, setSurnameError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const skipTypewriterRef = useRef(false);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const shadow = useShadows();

  const institutionSheetRef = useRef<InstitutionPickerSheetRef>(null);

  const nextScale = useSharedValue(1);
  const nextAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));
  const onPressIn = (sv: SharedValue<number>) => {
    sv.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };
  const onPressOut = (sv: SharedValue<number>) => {
    sv.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const {
    username,
    onChangeUsername,
    setUsernameValue,
    errorText: usernameErrorText,
    isAvailable: usernameAvailable,
    isChecking: usernameChecking,
    status: usernameStatus,
  } = useUsernameAvailability();

  const draftSnapshot = useMemo(
    () => ({
      step,
      firstName,
      lastName: surname,
      email,
      password,
      username,
      institution: selectedInstitution,
    }),
    [
      step,
      firstName,
      surname,
      email,
      password,
      username,
      selectedInstitution,
    ]
  );

  const { flushNow: flushDraft } = useSignupDraftPersistence(draftSnapshot, {
    enabled: draftReady,
    isHydrating,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { snapshot, hadDraft } = await loadSignupDraft();
      if (cancelled) return;
      if (snapshot) {
        setFirstName(snapshot.firstName);
        setSurname(snapshot.lastName);
        setEmail(snapshot.email);
        setPassword(snapshot.password);
        setUsernameValue(snapshot.username);
        setSelectedInstitution(snapshot.institution);
        setStep(snapshot.step);
        skipTypewriterRef.current = true;
        if (hadDraft) setShowResumeBanner(true);
      }
      setIsHydrating(false);
      setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setUsernameValue]);

  const goToStep = useCallback(
    async (next: SignupStep) => {
      Keyboard.dismiss();
      setStep(next);
      await flushDraft();
    },
    [flushDraft]
  );

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (firstNameError) setFirstNameError("");
  };

  const handleSurnameChange = (text: string) => {
    setSurname(text);
    if (surnameError) setSurnameError("");
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setFirstNameError("");
    setSurnameError("");
    setGeneralError("");
    setSchoolError(false);
  };

  const openSchoolPicker = () => {
    institutionSheetRef.current?.present();
  };

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setSchoolError(false);
  };

  const validateStep1 = (): boolean => {
    clearErrors();
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Must be at least 8 characters");
      valid = false;
    }
    if (!firstName.trim()) {
      setFirstNameError("Required");
      valid = false;
    }
    if (!surname.trim()) {
      setSurnameError("Required");
      valid = false;
    }
    return valid;
  };

  const handleNextFromStep1 = async () => {
    if (!validateStep1()) return;
    await goToStep(2);
  };

  const handleNextFromStep2 = async () => {
    if (!usernameAvailable || usernameChecking) return;
    await goToStep(3);
  };

  const handleBack = async () => {
    if (step === 2) await goToStep(1);
    else if (step === 3) await goToStep(2);
  };

  const canGoToStep3 = usernameAvailable && !usernameChecking;
  const canRegister = !!selectedInstitution && !isRegistering;

  const handleSignUp = async () => {
    clearErrors();
    if (!selectedInstitution) {
      setSchoolError(true);
      return;
    }
    if (!validateStep1() || !usernameAvailable) return;

    setIsRegistering(true);
    try {
      const response = await axios.post(`${ApiUrl}/api/register/`, {
        first_name: firstName,
        last_name: surname,
        email: email,
        password: password,
        username: username.trim(),
        institution_id: selectedInstitution.id,
      });
      await clearSignupDraft();
      router.navigate({
        pathname: "ConsentScreen",
        params: { email: response.data.user.email },
      });
    } catch (error: unknown) {
      console.error("Registration failed:", error);
      const err = error as {
        response?: { status?: number; data?: Record<string, unknown> };
      };
      if (err.response?.status === 400) {
        const data = err.response?.data;
        if (data?.institution_id || data?.institution) {
          setSchoolError(true);
        }
        setGeneralError(
          "Registration failed. Please check your information and try again."
        );
      } else if (err.response?.status === 409) {
        const data = err.response?.data;
        if (data?.username) {
          setGeneralError("Username is already in use");
          await goToStep(2);
        } else {
          setEmailError("An account with this email already exists.");
          await goToStep(1);
        }
      } else if (err.response?.status === 500) {
        setGeneralError("Server error. Please try again later.");
      } else {
        setGeneralError(
          "Registration failed. Please check your internet connection and try again."
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSignIn = async () => {
    await clearSignupDraft();
    router.dismissTo("LogIn");
  };

  const dismissResumeBanner = () => setShowResumeBanner(false);

  const hasError = !!(emailError || passwordError || firstNameError || surnameError || generalError);
  const usernameLabelColor =
    usernameErrorText || usernameStatus === "invalid"
      ? "#D22B2B"
      : usernameStatus === "available"
        ? themeColors.tint
        : undefined;

  // Step icon lookup
  const stepIcons = {
    1: <UserPlus size={28} color={themeColors.tint} />,
    2: <AtSign size={28} color={themeColors.tint} />,
    3: <School size={28} color={themeColors.tint} />,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    // Glassmorphism background blobs
    blob1: {
      position: "absolute",
      top: -rV(60),
      left: -rS(70),
      width: rS(260),
      height: rS(260),
      borderRadius: rS(130),
      backgroundColor: themeColors.tint + "18",
    },
    blob2: {
      position: "absolute",
      bottom: rV(60),
      right: -rS(90),
      width: rS(300),
      height: rS(300),
      borderRadius: rS(150),
      backgroundColor: "#10B98118",
    },
    blob3: {
      position: "absolute",
      top: rV(350),
      right: -rS(30),
      width: rS(160),
      height: rS(160),
      borderRadius: rS(80),
      backgroundColor: "#6366F115",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: rMS(16),
      paddingBottom: rV(80),
    },
    // Hero
    heroSection: {
      alignItems: "center",
      marginBottom: rV(8),
    },
    heroLabel: {
      fontSize: rMS(10),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 3,
      color: themeColors.tint,
      marginBottom: rV(10),
    },
    heroIconCircle: {
      width: rMS(56),
      height: rMS(56),
      borderRadius: rMS(28),
      backgroundColor: themeColors.tint + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rV(16),
    },
    headerText: {
      fontSize: rMS(28),
      fontWeight: "900",
      color: themeColors.text,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    // Form card — glassmorphic
    formCard: {
      backgroundColor: themeColors.cardGlass,
      borderRadius: rMS(32),
      padding: rMS(24),
      marginTop: rV(16),
      width: "100%",
      maxWidth: rS(320),
      borderWidth: 1,
      borderColor: themeColors.border + "60",
      ...shadow.medium,
    },
    resumeBanner: {
      width: "100%",
      backgroundColor: themeColors.tint + "14",
      borderRadius: rMS(16),
      paddingVertical: rV(10),
      paddingHorizontal: rS(14),
      marginBottom: rV(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    resumeText: {
      flex: 1,
      fontSize: rMS(12),
      fontWeight: "600",
      color: themeColors.tint,
    },
    resumeDismiss: {
      fontSize: rMS(12),
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginLeft: rS(8),
    },
    rowContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    halfInput: {
      flex: 1,
    },
    inputContainer: {
      width: "100%",
    },
    fieldBlock: {
      width: "100%",
      marginBottom: rV(4),
    },
    helperText: {
      fontSize: rMS(12),
      fontWeight: "600",
      marginTop: rV(4),
      marginBottom: rV(8),
      paddingHorizontal: rS(4),
    },
    spacing: {
      height: rV(12),
    },
    // Primary button (Next / Register)
    primaryButton: {
      backgroundColor: themeColors.tint,
      borderRadius: rMS(22),
      paddingVertical: rV(14),
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      ...shadow.small,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: rMS(15),
      fontWeight: "800",
    },
    backLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: rV(14),
      paddingVertical: rV(8),
      gap: rS(4),
    },
    backText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.textSecondary,
      textAlign: "center",
    },
    inlineError: {
      fontSize: rMS(12),
      color: "#D22B2B",
      fontWeight: "500",
      marginTop: -rMS(12),
      marginBottom: rV(4),
      paddingHorizontal: rS(4),
    },
    generalError: {
      fontSize: rMS(13),
      color: "#D22B2B",
      fontWeight: "600",
      textAlign: "center",
      marginTop: rV(12),
    },
    bottomContainer: {
      position: "absolute",
      bottom: Math.max(rV(20), insets.bottom + rV(10)),
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
    },
    existingText: {
      fontSize: rMS(13),
      color: themeColors.textSecondary,
    },
    loginText: {
      fontSize: rMS(13),
      fontWeight: "700",
      color: themeColors.tint,
      marginLeft: rMS(4),
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: rV(200),
    },
  });

  if (isHydrating) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />
        <View style={styles.loadingWrap}>
          <ScreenLoadingSpinner style={{ flex: 0 }} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              style={styles.heroSection}
            >
              
              <View style={styles.heroIconCircle}>
                {stepIcons[step]}
              </View>
            </Animated.View>

            {/* Step Indicator */}
            <SignupStepIndicator step={step} />

            {showResumeBanner ? (
              <View style={styles.resumeBanner}>
                <Text style={styles.resumeText}>
                  Picking up where you left off
                </Text>
                <TouchableOpacity onPress={dismissResumeBanner}>
                  <Text style={styles.resumeDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Form Card */}
            <Animated.View
              entering={FadeInUp.duration(500).delay(300)}
              style={styles.formCard}
            >
              {step === 1 && (
                <Animated.View key="step1" entering={FadeInDown.duration(350)}>
                  {skipTypewriterRef.current ? (
                    <Text style={[styles.headerText, { marginBottom: rV(20) }]}>
                      Create an account
                    </Text>
                  ) : (
                    <Typewriter
                      text="Create an account"
                      delay={10}
                      style={[styles.headerText, { marginBottom: rV(20) }]}
                    />
                  )}

                  <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                    <AnimatedTextInput
                      label="Email"
                      value={email}
                      onChangeText={handleEmailChange}
                      placeholderTextColor={themeColors.textSecondary}
                      style={styles.inputContainer}
                      labelColor={emailError ? "#D22B2B" : undefined}
                    />
                    {emailError ? (
                      <Text style={styles.inlineError}>{emailError}</Text>
                    ) : null}
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(400).delay(150)}>
                    <AnimatedTextInput
                      label="Password"
                      value={password}
                      onChangeText={handlePasswordChange}
                      placeholderTextColor={themeColors.textSecondary}
                      secureTextEntry
                      showToggleIcon
                      style={styles.inputContainer}
                      labelColor={passwordError ? "#D22B2B" : undefined}
                    />
                    {passwordError ? (
                      <Text style={styles.inlineError}>{passwordError}</Text>
                    ) : null}
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.duration(400).delay(220)}
                    style={styles.rowContainer}
                  >
                    <View style={[styles.halfInput, { marginRight: rS(20) }]}>
                      <AnimatedTextInput
                        label="First Name"
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        placeholderTextColor={themeColors.textSecondary}
                        labelColor={firstNameError ? "#D22B2B" : undefined}
                      />
                      {firstNameError ? (
                        <Text style={styles.inlineError}>{firstNameError}</Text>
                      ) : null}
                    </View>
                    <View style={styles.halfInput}>
                      <AnimatedTextInput
                        label="Last Name"
                        value={surname}
                        onChangeText={handleSurnameChange}
                        placeholderTextColor={themeColors.textSecondary}
                        labelColor={surnameError ? "#D22B2B" : undefined}
                      />
                      {surnameError ? (
                        <Text style={styles.inlineError}>{surnameError}</Text>
                      ) : null}
                    </View>
                  </Animated.View>

                  <View style={styles.spacing} />

                  <AnimatedTouchable
                    style={[styles.primaryButton, nextAnimStyle]}
                    onPress={handleNextFromStep1}
                    onPressIn={() => onPressIn(nextScale)}
                    onPressOut={() => onPressOut(nextScale)}
                    activeOpacity={1}
                  >
                    <Text style={styles.primaryButtonText}>Next</Text>
                  </AnimatedTouchable>

                  {generalError ? (
                    <Text style={styles.generalError}>{generalError}</Text>
                  ) : null}
                </Animated.View>
              )}

              {step === 2 && (
                <Animated.View key="step2" entering={FadeInDown.duration(350)}>
                  <Text style={[styles.headerText, { marginBottom: rV(6) }]}>
                    What should we call you?
                  </Text>
                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: themeColors.textSecondary,
                        marginBottom: rV(20),
                        fontSize: rMS(13),
                        fontWeight: "500",
                      },
                    ]}
                  >
                    This is how you show up on leaderboards and squads—not your legal name.
                  </Text>

                  <View style={styles.fieldBlock}>
                    <AnimatedTextInput
                      label="Username"
                      value={username}
                      onChangeText={onChangeUsername}
                      placeholderTextColor={themeColors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      labelColor={usernameLabelColor}
                    />
                    {usernameErrorText ? (
                      <Text style={[styles.helperText, { color: "#D22B2B" }]}>
                        {usernameErrorText}
                      </Text>
                    ) : usernameStatus === "available" ? (
                      <Text style={[styles.helperText, { color: themeColors.tint }]}>
                        That's yours — you're good.
                      </Text>
                    ) : usernameStatus === "checking" ? (
                      <Text
                        style={[
                          styles.helperText,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Checking if that's free...
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.spacing} />

                  <AnimatedTouchable
                    style={[
                      styles.primaryButton,
                      !canGoToStep3 && styles.primaryButtonDisabled,
                      nextAnimStyle,
                    ]}
                    onPress={handleNextFromStep2}
                    onPressIn={() => onPressIn(nextScale)}
                    onPressOut={() => onPressOut(nextScale)}
                    activeOpacity={1}
                    disabled={!canGoToStep3}
                  >
                    <Text style={styles.primaryButtonText}>Next</Text>
                  </AnimatedTouchable>

                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={handleBack}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={14} color={themeColors.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>

                  {generalError ? (
                    <Text style={styles.generalError}>{generalError}</Text>
                  ) : null}
                </Animated.View>
              )}

              {step === 3 && (
                <Animated.View key="step3" entering={FadeInDown.duration(350)}>
                  <Text style={[styles.headerText, { marginBottom: rV(6) }]}>
                    Where are you at?
                  </Text>
                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: themeColors.textSecondary,
                        marginBottom: rV(20),
                        fontSize: rMS(13),
                        fontWeight: "500",
                      },
                    ]}
                  >
                    Drop your school so we can rank you with your people.
                  </Text>

                  <InstitutionSelectField
                    selected={selectedInstitution}
                    onPress={openSchoolPicker}
                    hasError={schoolError}
                    errorMessage="Pick a school to finish up."
                    hint="Tap to find your campus"
                  />

                  <View style={styles.spacing} />

                  <AnimatedTouchable
                    style={[
                      styles.primaryButton,
                      !canRegister && styles.primaryButtonDisabled,
                      nextAnimStyle,
                    ]}
                    onPress={handleSignUp}
                    onPressIn={() => onPressIn(nextScale)}
                    onPressOut={() => onPressOut(nextScale)}
                    activeOpacity={1}
                    disabled={!canRegister}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isRegistering ? "Creating account..." : "Register"}
                    </Text>
                  </AnimatedTouchable>

                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={handleBack}
                    activeOpacity={0.7}
                    disabled={isRegistering}
                  >
                    <ArrowLeft size={14} color={themeColors.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>

                  {generalError ? (
                    <Text style={styles.generalError}>{generalError}</Text>
                  ) : null}
                </Animated.View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomContainer}>
          <Text style={styles.existingText}>Already have an account?</Text>
          <Text style={styles.loginText} onPress={handleSignIn}>
            Login
          </Text>
        </View>
      </View>

      <InstitutionPickerSheet
        ref={institutionSheetRef}
        onSelect={handleInstitutionSelect}
      />
    </>
  );
};

export default ContinueWithEmail;
