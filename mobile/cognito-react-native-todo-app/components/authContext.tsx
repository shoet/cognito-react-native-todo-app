import { createContext, PropsWithChildren, useContext, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import {
  authWithGoogle,
  exchangeToken,
  revokeToken,
  refreshToken as refreshAccessToken,
  AuthError,
} from "@/libs/authSession";

class AuthContextError extends Error {
  detailError?: Error;
  constructor(message: string, detailError?: Error) {
    super(message);
    this.name = "AuthContextError";
    this.detailError = detailError;
  }
}

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

  const authorizationEndpoint = `${cognitoDomain}/oauth2/authorize`;
  const tokenEndpoint = `${cognitoDomain}/oauth2/token`;
  const revocationEndpoint = `${cognitoDomain}/oauth2/revoke`;

  const loginWithGoogle = async () => {
    setError(undefined);
    const redirectUri = makeRedirectUri({
      scheme: appSchema,
    });
    const authResult = await authWithGoogle(
      cognitoClientId,
      redirectUri,
      authorizationEndpoint,
      ["openid", "email"],
    );
    if (authResult.type === "failure") {
      console.error("failed to failed to auth with google:", authResult.error);
      setError(new AuthContextError("認証に失敗しました", authResult.error));
      return;
    }
    const tokenResult = await exchangeToken(
      cognitoClientId,
      redirectUri,
      tokenEndpoint,
      authResult.data.code,
      authResult.data.codeVerifier,
    );
    if (tokenResult.type === "failure") {
      console.error("failed to get token", tokenResult.error);
      setError(
        new AuthContextError(
          "認証トークンの取得に失敗しました",
          tokenResult.error,
        ),
      );
      return;
    }
    setAccessToken(tokenResult.data.accessToken);
    setRefreshToken(tokenResult.data.refreshToken);
  };

  const logout = async () => {
    if (accessToken) {
      const result = await revokeToken(
        cognitoClientId,
        revocationEndpoint,
        accessToken,
      );
      if (result.type === "failure") {
        console.error("failed to revoke access token");
        setError(new AuthContextError("アクセストークンの失効に失敗しました"));
        return;
      }
    }
    setAccessToken(undefined);
  };

  const mutateToken = async () => {
    if (!refreshToken) {
      console.error("refresh token not found");
      setError(
        new AuthContextError(
          "トークンの更新に失敗しました",
          accessTokenResult.error,
        ),
      );
      return;
    }
    const result = await refreshAccessToken(
      cognitoClientId,
      refreshToken,
      tokenEndpoint,
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
