import { Button, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { useAuth } from "@/components/authContext";
import { getApiUrl } from "@/utils";
import { useState } from "react";
import { UIError } from "@/types";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { logout, accessToken, mutateToken } = useAuth();
  const [error, setError] = useState<UIError>();
  const [isLoading, setIsLoading] = useState(false);

  const apiRequest = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      const url = getApiUrl("/health");
      const response = await fetch(url, {
        method: "GET",
      });
      if (response.status !== 200) {
        setError(
          new UIError("failed to request", {
            displayMessage: "APIリクエストでエラーが発生しました",
          }),
        );
        return;
      }
      alert("success");
    } catch (e) {
      console.error("failed to request:", e);
      setError(
        new UIError("failed to request", {
          displayMessage: "APIリクエストでエラーが発生しました",
        }),
      );
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const apiRequestSecure = async (accessToken: string) => {
    setError(undefined);
    setIsLoading(true);
    try {
      console.log(accessToken);
      const url = getApiUrl("/secure");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status !== 200) {
        setError(
          new UIError("failed to request", {
            displayMessage: "APIリクエストでエラーが発生しました",
          }),
        );
        return;
      }
      alert("success");
    } catch (e) {
      console.error("failed to request:", e);
      setError(
        new UIError("failed to request", {
          displayMessage: "APIリクエストでエラーが発生しました",
        }),
      );
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: "TodoPage" }} />
      <View>
        <Button title="Logout" onPress={logout} />
        <Button title="APIRequest" onPress={apiRequest} />
        <Button title="MutateToken" onPress={mutateToken} />
        <Button
          title="APIRequestSecure"
          onPress={() => accessToken && apiRequestSecure(accessToken)}
          disabled={!accessToken}
        />
        {isLoading && <Text>loading...</Text>}
        {error?.displayMessage && <Text>{error.displayMessage}</Text>}
      </View>
    </>
  );
}
