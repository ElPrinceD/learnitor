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
          console.log("Sign-in was cancelled");
          break;
        case statusCodes.IN_PROGRESS:
          console.log("Sign-in is already in progress");
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log("Play Services not available");
          break;
        default:
          console.log("An unknown error occurred");
      }
    } else {
      console.error("Non-Google sign-in error", error);
    }
  }
};
