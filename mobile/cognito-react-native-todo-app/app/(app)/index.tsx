import { Button, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { useAuth } from "@/components/authContext";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { logout } = useAuth();
  return (
    <>
      <Stack.Screen options={{ headerTitle: "TodoPage" }} />
      <View>
        <Button title="Logout" onPress={logout} />
      </View>
    </>
  );
}
