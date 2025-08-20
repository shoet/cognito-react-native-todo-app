import { createContext, PropsWithChildren, useContext, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import {
  authWithGoogle,
  exchangeToken,
  revokeToken,
  refreshToken as refreshAccessToken,
} from "@/libs/authSession";
import { SecureStore } from "@/libs/secureStore";
import { jwtDecode } from "jwt-decode";
import { Result } from "@/types";

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
  error?: AuthContextError;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  mutateToken: () => Promise<void>;
  getAccessToken: () => Promise<Result<{ accessToken: string }>>;
};

const AuthContext = createContext<AuthContextType>({
  loginWithGoogle: async () => {},
  logout: async () => {},
  mutateToken: async () => {},
  getAccessToken: async () => ({ type: "success", data: { accessToken: "" } }),
});

export const useAuth = () => useContext(AuthContext);

type Props = {
  cognitoDomain: string;
  cognitoClientId: string;
  appSchema: string;
};

/**
 * トークン管理について
 * アクセストークン：メモリ上で保持
 * リフレッシュトークン：SecureStoreで端末上に保持
 */

export const AuthContextProvider = (props: PropsWithChildren<Props>) => {
  const { children, cognitoDomain, cognitoClientId, appSchema, ...rest } =
    props;

  const secureStore = new SecureStore(appSchema);
  const [accessToken, setAccessToken] = useState<string>();
  const [error, setError] = useState<AuthContextError>();

  const authorizationEndpoint = `${cognitoDomain}/oauth2/authorize`;
  const tokenEndpoint = `${cognitoDomain}/oauth2/token`;
  const revocationEndpoint = `${cognitoDomain}/oauth2/revoke`;

  /**
   * 端末上に保存されたリフレッシュトークンからアクセストークンを取得する
   */
  const getAccessTokenByRefreshToken = async (): Promise<
    Result<{ accessToken: string }>
  > => {
    // アクセストークンがセットされていない場合は、SecureStoreのリフレッシュトークンから取得する
    const refreshTokenResult = await secureStore.safeGetAPIRefreshToken();
    if (refreshTokenResult.type === "failure") {
      return {
        type: "failure",
        error: new Error(
          "failed to get refresh token",
          refreshTokenResult.error,
        ),
      };
    }
    if (refreshTokenResult.data.refreshToken === null) {
      return {
        type: "failure",
        error: new Error("refresh token not found"),
      };
    }
    const accessTokenResult = await refreshAccessToken(
      cognitoClientId,
      refreshTokenResult.data.refreshToken,
      tokenEndpoint,
    );
    return accessTokenResult;
  };

  /**
   * アクセストークンを取得する
   */
  const getAccessToken = async (): Promise<Result<{ accessToken: string }>> => {
    if (accessToken) {
      const payload = jwtDecode(accessToken);
      // アクセストークンの期限切れはリフレッシュトークンをもとの取得する
      const exp = (payload.exp || 0) * 1000;
      if (Date.now() > exp) {
        return await getAccessTokenByRefreshToken();
      }
      return {
        type: "success",
        data: {
          accessToken: accessToken,
        },
      };
    } else {
      // アクセストークンがない場合はリフレッシュトークンをもとに取得する
      return await getAccessTokenByRefreshToken();
    }
  };

  /**
   * Googleのソーシャルログインを行う
   * ログインに成功したらアクセストークンをメモリ上に保持
   * リフレッシュトークンを端末上に保存する
   */
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
    if (tokenResult.data.refreshToken) {
      await secureStore.sefeSetAPIRefreshToken(tokenResult.data.refreshToken);
    }
  };

  /**
   * ログアウト処理
   * 端末上のリフレッシュトークンを失効し、アクセストークンを破棄する
   */
  const logout = async () => {
    // リフレッシュトークンがSecureStoreにあれば失効する
    const refreshTokenResult = await secureStore.safeGetAPIRefreshToken();
    if (
      refreshTokenResult.type === "success" &&
      refreshTokenResult.data.refreshToken
    ) {
      const result = await revokeToken(
        cognitoClientId,
        revocationEndpoint,
        refreshTokenResult.data.refreshToken,
      );
      if (result.type === "failure") {
        console.error("failed to revoke refresh token");
        setError(
          new AuthContextError("リフレッシュトークンの失効に失敗しました"),
        );
        return;
      }
      const deleteTokenResult = await secureStore.sefeDeleteAPIRefreshToken();
      if (deleteTokenResult.type === "failure") {
        console.error("failed to delete refresh token");
        setError(
          new AuthContextError("リフレッシュトークンの削除に失敗しました"),
        );
        return;
      }
    }
    // アクセストークンを失効する
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

  /**
   * アクセストークンを再取得する
   */
  const mutateToken = async () => {
    console.log("mutate");
    const accessTokenResult = await getAccessToken();
    if (accessTokenResult.type === "success") {
      setAccessToken(accessTokenResult.data.accessToken);
    }
  };

  return (
    <AuthContext
      value={{
        accessToken,
        loginWithGoogle,
        logout,
        error,
        mutateToken,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext>
  );
};
