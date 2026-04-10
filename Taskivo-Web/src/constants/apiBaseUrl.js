import { Capacitor } from "@capacitor/core";

const ENV_API_URL = import.meta.env.VITE_API_URL?.trim();

function getNativeDefaultApiUrl() {
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    // Android emulators reach the host machine through 10.0.2.2, not localhost.
    // Real phones should set VITE_API_URL to the computer's LAN IP.
    return "http://10.0.2.2:3001/api";
  }

  return "http://localhost:3001/api";
}

export const API_URL =
  ENV_API_URL || (Capacitor.isNativePlatform() ? getNativeDefaultApiUrl() : "http://localhost:3001/api");
