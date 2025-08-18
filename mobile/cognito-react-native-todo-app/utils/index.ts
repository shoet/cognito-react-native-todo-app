import { Result } from "@/types";
import { z } from "zod";

const EnvObject = z.object({
  EXPO_PUBLIC_COGNITO_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_COGNITO_CLIENT_ID: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.string().min(1),
});

export type Env = z.infer<typeof EnvObject>;

export function safeGetEnv(): Result<Env> {
  const { success, data, error } = EnvObject.safeParse(process.env);
  if (!success) {
    return {
      type: "failure",
      error: new Error("failed to parse env:" + error.message),
    };
  }
  return {
    type: "success",
    data: data,
  };
}

export function getApiUrl(path: string): string {
  const result = safeGetEnv();
  if (result.type === "failure") {
    throw new Error("failed to get env:", result.error);
  }
  return `${result.data.EXPO_PUBLIC_API_URL}${path}`;
}
