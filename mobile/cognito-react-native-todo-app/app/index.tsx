import { useAuth } from "@/components/authContext";
import { Button, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { accessToken, loginWithGoogle, logout, error } = useAuth();
  return (
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
  );
}
