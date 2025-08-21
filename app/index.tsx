import { useEffect } from "react";
import { router } from "expo-router";

export default function Index() {
  useEffect(() => {
    router.replace("/Login"); // Atau "/login" kalau nama file-mu lowercase
  }, []);

  return null;
}
