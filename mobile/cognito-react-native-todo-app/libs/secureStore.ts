import { Result } from "@/types";
import { getItemAsync, setItemAsync } from "expo-secure-store";

const API_REFRESH_TOKEN_KEY = "api.refresh_token";

export class SecureStore {
  readonly appScheme: string;

  constructor(appScheme: string) {
    this.appScheme = appScheme;
  }

  async safeGetAPIRefreshToken(): Promise<
    Result<{ refreshToken: string | null }>
  > {
    const key = `${this.appScheme}.${API_REFRESH_TOKEN_KEY}`;
    try {
      const value = await getItemAsync(key);
      return {
        type: "success",
        data: {
          refreshToken: value,
        },
      };
    } catch (e: any) {
      return {
        type: "failure",
        error: new Error("failed to get refreshToken from secure store", e),
      };
    }
  }

  async sefeSetAPIRefreshToken(
    refreshToken: string,
  ): Promise<Result<undefined>> {
    const key = `${this.appScheme}.${API_REFRESH_TOKEN_KEY}`;
    try {
      await setItemAsync(key, refreshToken);
      return {
        type: "success",
        data: undefined,
      };
    } catch (e: any) {
      return {
        type: "failure",
        error: new Error("failed to save refreshToken to secure store", e),
      };
    }
  }
}
