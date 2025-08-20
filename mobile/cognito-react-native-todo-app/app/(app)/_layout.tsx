import { useAuth } from "@/components/authContext";
import { Stack, useFocusEffect } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const { mutateToken } = useAuth();

  useFocusEffect(() => {
    mutateToken();
  });

  return <Stack />;
}
