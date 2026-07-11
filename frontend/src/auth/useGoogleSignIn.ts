import { useCallback } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
      prompt: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) return resolve();
    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
}

/**
 * Returns a trigger that runs the Google One Tap / popup flow and resolves the
 * ID token via the provided callback. Google sign-in is optional — if no client
 * ID is configured it throws a friendly error the caller can surface.
 */
export function useGoogleSignIn(onCredential: (idToken: string) => void) {
  return useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google sign-in is not configured (set VITE_GOOGLE_CLIENT_ID).");
    }
    await loadScript();
    window.google!.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => onCredential(resp.credential),
    });
    window.google!.accounts.id.prompt();
  }, [onCredential]);
}

export const googleConfigured = Boolean(GOOGLE_CLIENT_ID);
