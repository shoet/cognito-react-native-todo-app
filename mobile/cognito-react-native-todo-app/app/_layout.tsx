import { AuthContextProvider, useAuth } from "@/components/authContext";
import { Stack, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const cognitoDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN || "";
const cognitoClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || "";

export default function RootLayout() {
  return (
    <AuthContextProvider
      appSchema="cognitoreactnativetodoapp"
      cognitoDomain={cognitoDomain}
      cognitoClientId={cognitoClientId}
    >
      <RootNavigator />
    </AuthContextProvider>
  );
}

function RootNavigator() {
  const { accessToken } = useAuth();

  return (
    <Stack>
      <Stack.Protected guard={accessToken !== undefined}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={accessToken === undefined}>
        <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}
