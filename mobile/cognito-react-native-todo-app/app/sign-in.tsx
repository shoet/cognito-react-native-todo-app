import { useAuth } from "@/components/authContext";
import { Button, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { accessToken, loginWithGoogle, logout, error, mutateToken } =
    useAuth();

  useEffect(() => {
    mutateToken();
  }, []);

  return (
    <>
      <Stack.Screen name="index" />
      <View>
        <TextInput
          value={accessToken}
          readOnly
          style={{
            borderWidth: 1,
            borderColor: "gray",
            borderRadius: 5,
            padding: 5,
          }}
        />
        {error && (
          <Text style={{ fontSize: 20, color: "red" }}>{error.message}</Text>
        )}
        <Button title="LoginGoogle" onPress={loginWithGoogle} />
        <Button
          title="Logout"
          onPress={logout}
          disabled={accessToken === undefined}
        />
      </View>
    </>
  );
}
