import { AuthContextProvider } from "@/components/authContext";
import { Stack } from "expo-router";
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
      <Stack />
    </AuthContextProvider>
  );
}
