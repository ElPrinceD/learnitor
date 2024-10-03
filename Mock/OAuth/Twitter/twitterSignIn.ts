import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import ApiUrl from "../../config";
// Twitter OAuth endpoints
const discovery = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://twitter.com/i/oauth2/token",
  revocationEndpoint: "https://twitter.com/i/oauth2/revoke",
  
};


// Custom hook for Twitter sign-in
export const twitterSignIn = (clientId: string) => {
  const redirectUri = `${ApiUrl}/api/twitter/signup/`;


  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId,
      redirectUri: redirectUri,
      usePKCE: true,
      scopes: ["tweet.read", "users.read"],
    },
    discovery
  );

  const [status, setStatus] = useState<string>('');
  const [authCode, setAuthCode] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      setAuthCode(code);
      setStatus('Success! Authorization code received.');
    } else if (response?.type === 'error') {
      setStatus('Error during sign-in process');
    }
  }, [response]);

  const signInWithTwitter = async () => {
    try {
      await promptAsync();
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return {
    status,
    authCode,
    signInWithTwitter,
    request, 
  };
};
