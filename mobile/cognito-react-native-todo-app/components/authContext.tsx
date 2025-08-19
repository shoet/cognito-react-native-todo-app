import { createContext, PropsWithChildren, useContext, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import {
  authWithGoogle,
  exchangeToken,
  revokeToken,
  refreshToken as refreshAccessToken,
  AuthError,
} from "@/libs/authSession";

type AuthContextError = {
  message: string;
  error?: Error;
};

type AuthContextType = {
  accessToken?: string;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  mutateToken: () => Promise<void>;
  error?: AuthContextError;
};

const AuthContext = createContext<AuthContextType>({
  loginWithGoogle: async () => {},
  logout: async () => {},
  mutateToken: async () => {},
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
    setRefreshToken(tokenResult.data.refreshToken);
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
        return;
      }
    }
    setAccessToken(undefined);
  };

  const mutateToken = async () => {
    if (!refreshToken) {
      console.error("refresh token not found");
      setError({
        message: "リフレッシュトークンが見つかりませんでした",
      });
      return;
    }
    const result = await refreshAccessToken(
      cognitoClientId,
      refreshToken,
      `${cognitoDomain}/oauth2/token`,
    );
    if (result.type === "failure") {
      console.error("failed to refresh token", result.error);
      setError({
        message: "トークンの更新に失敗しました",
      });
      return;
    }
    setAccessToken(result.data.accessToken);
  };

  return (
    <AuthContext
      value={{
        accessToken,
        loginWithGoogle,
        logout,
        error,
        mutateToken,
      }}
    >
      {children}
    </AuthContext>
  );
};
