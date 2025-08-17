import { createContext, PropsWithChildren, useContext, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { authWithGoogle, exchangeToken, revokeToken } from "@/libs/authSession";

type AuthContextError = {
  message: string;
  error?: Error;
};

type AuthContextType = {
  accessToken?: string;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error?: AuthContextError;
};

const AuthContext = createContext<AuthContextType>({
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type Props = {
  cognitoDomain: string;
  cognitoClientId: string;
  appSchema: string;
};

export const AuthContextProvider = (props: PropsWithChildren<Props>) => {
  const { children, cognitoDomain, cognitoClientId, appSchema, ...rest } =
    props;

  const [accessToken, setAccessToken] = useState<string>();
  const [refreshToken, setRefreshToken] = useState<string>();
  const [error, setError] = useState<AuthContextError>();

  const loginWithGoogle = async () => {
    setError(undefined);
    const redirectUri = makeRedirectUri({
      scheme: appSchema,
    });
    const authResult = await authWithGoogle(
      cognitoClientId,
      redirectUri,
      `${cognitoDomain}/oauth2/authorize`,
      ["openid", "email"],
    );
    if (authResult.type === "failure") {
      console.error("failed to failed to auth with google:", authResult.error);
      setError({
        message: "認証に失敗しました",
        error: authResult.error,
      });
      return;
    }
    const tokenResult = await exchangeToken(
      cognitoClientId,
      redirectUri,
      `${cognitoDomain}/oauth2/token`,
      authResult.data.code,
      authResult.data.codeVerifier,
    );
    if (tokenResult.type === "failure") {
      console.error("failed to get token", tokenResult.error);
      setError({
        message: "認証トークンの取得に失敗しました",
        error: tokenResult.error,
      });
      return;
    }
    setAccessToken(tokenResult.data.accessToken);
    console.log("tokenResult", tokenResult);
  };

  const logout = async () => {
    if (accessToken) {
      const result = await revokeToken(
        cognitoClientId,
        `${cognitoDomain}/oauth2/revoke`,
        accessToken,
      );
      if (result.type === "failure") {
        console.error("failed to revoke token");
        setError({
          message: "トークンの失効に失敗しました",
        });
      }
      setAccessToken(undefined);
    }
  };

  return (
    <AuthContext
      value={{
        accessToken,
        loginWithGoogle,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext>
  );
};
