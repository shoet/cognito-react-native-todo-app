import { Button, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { useAuth } from "@/components/authContext";
import { getApiUrl } from "@/utils";
import { useState } from "react";
import { UIError } from "@/types";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { logout, mutateToken, getAccessToken } = useAuth();
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

  const apiRequestSecure = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      const resultAccessToken = await getAccessToken();
      if (resultAccessToken.type === "failure") {
        setError(
          new UIError("failed to get access token", {
            displayMessage: "認証に失敗しました",
          }),
        );
        return;
      }
      const url = getApiUrl("/secure");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resultAccessToken.data.accessToken}`,
        },
      });
      if (response.status !== 200) {
        console.error(response);
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
        <Button title="APIRequestSecure" onPress={() => apiRequestSecure()} />
        {isLoading && <Text>loading...</Text>}
        {error?.displayMessage && <Text>{error.displayMessage}</Text>}
      </View>
    </>
  );
}
