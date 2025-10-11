import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

export const googleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userI = await GoogleSignin.signIn();
    return userI; // Return userI directly
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          break;
        case statusCodes.IN_PROGRESS:
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          break;
        default:
      }
    } else {
      console.error("Non-Google sign-in error", error);
    }
  }
};
