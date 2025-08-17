import { Button, Text, TextInput, View } from "react-native";
import { makeRedirectUri, AuthRequest, revokeAsync } from "expo-auth-session";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const cognitoDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN || "";
const cognitoClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || "";

export default function Index() {
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();

  const auth = async () => {
    const request = new AuthRequest({
      clientId: cognitoClientId,
      scopes: ["openid", "email"],
      responseType: "code",
      redirectUri: makeRedirectUri({
        scheme: "cognitoreactnativetodoapp",
      }),
      extraParams: {
        identity_provider: "Google",
      },
    });
    console.log(`### [AuthRequest] debug`, {
      request,
    });
    const result = await request.promptAsync({
      authorizationEndpoint: `${cognitoDomain}/oauth2/authorize`,
    });
    console.log(`### [AuthSessionResult] debug`, {
      result,
    });
    return result;
  };

  const handleLogin = async () => {
    setError(undefined);
    const result = await auth();
    if (result?.type === "error") {
      console.log("### error", { error: result.error });
      setError(result.error?.message);
      return;
    }
    if (result?.type === "success") {
      const { code } = result.params;
      setCode(code);
    }
  };

  const handleLogout = async () => {
    console.log("logout", code);
    if (code === undefined) {
      console.log("hoge", code);
      return;
    }
    try {
      const result = await revokeAsync(
        {
          token: code,
          clientId: cognitoClientId, // 設定しないとレスポンスが帰ってこない、throwもされない
        },
        {
          revocationEndpoint: `${cognitoDomain}/oauth2/revoke`,
        },
      );
      if (result) {
        console.log("### logout success");
        setCode(undefined);
      } else {
        setError("ログアウトに失敗しました");
      }
    } catch (e) {
      console.error("# error", { e });
      setError("ログアウトに失敗しました");
    }
  };

  return (
    <View>
      <TextInput
        value={code}
        readOnly
        style={{
          borderWidth: 1,
          borderColor: "gray",
          borderRadius: 5,
          padding: 5,
        }}
      />
      {error && <Text style={{ fontSize: 20, color: "red" }}>{error}</Text>}
      <Button title="LoginGoogle" onPress={handleLogin} />
      <Button
        title="Logout"
        onPress={handleLogout}
        disabled={code === undefined}
      />
    </View>
  );
}
