import {
  AuthRequest,
  exchangeCodeAsync,
  TokenResponse,
  revokeAsync,
} from "expo-auth-session";
import { Result } from "@/types";

class AuthError<T> extends Error {
  detail?: T;
  constructor(message: string, detail?: T) {
    super(message);
    this.name = "AuthError";
    this.detail = detail;
  }
}

export async function authWithGoogle(
  cognitoClientId: string,
  redirectUri: string,
  authorizationEndpoint: string,
  scopes: string[],
): Promise<Result<{ code: string; codeVerifier: string }>> {
  const request = new AuthRequest({
    clientId: cognitoClientId,
    scopes: scopes,
    responseType: "code",
    redirectUri,
    extraParams: {
      identity_provider: "Google",
    },
    usePKCE: true,
  });
  try {
    const authResult = await request.promptAsync({
      authorizationEndpoint,
    });
    if (authResult.type === "success") {
      const { code } = authResult.params;
      if (!request.codeVerifier) {
        return {
          type: "failure",
          error: new AuthError("code_verifier not created"),
        };
      }
      return {
        type: "success",
        data: {
          code: code,
          codeVerifier: request.codeVerifier,
        },
      };
    } else {
      console.error(
        `AuthRequest response is not success: ${authResult.type.toString()}`,
        authResult,
      );
      return {
        type: "failure",
        error: new AuthError(
          `AuthRequest response is not success: ${authResult.type.toString()}`,
          authResult,
        ),
      };
    }
  } catch (e) {
    return {
      type: "failure",
      error: new AuthError("unexpected error", e),
    };
  }
}

export async function exchangeToken(
  cognitoClientId: string,
  redirectUri: string,
  tokenEndpoint: string,
  code: string,
  codeVerifier: string,
): Promise<Result<TokenResponse>> {
  try {
    const result = await exchangeCodeAsync(
      {
        code: code,
        redirectUri: redirectUri,
        clientId: cognitoClientId,
        extraParams: {
          code_verifier: codeVerifier,
        },
      },
      {
        tokenEndpoint,
      },
    );
    return {
      type: "success",
      data: result,
    };
  } catch (e) {
    return {
      type: "failure",
      error: new AuthError("unexpected error", e),
    };
  }
}

export async function revokeToken(
  cognitoClientId: string,
  revocationEndpoint: string,
  refreshOrAccessToken: string,
): Promise<Result<{ result: boolean }>> {
  const result = await revokeAsync(
    {
      token: refreshOrAccessToken,
      clientId: cognitoClientId,
    },
    {
      revocationEndpoint,
    },
  );
  if (!result) {
    return {
      type: "failure",
      error: new AuthError("failed to revoke revoke"),
    };
  }
  return {
    type: "success",
    data: {
      result: true,
    },
  };
}
