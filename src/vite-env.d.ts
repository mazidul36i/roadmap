/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  /** Set to "true" to talk to the local Functions emulator in development. */
  readonly VITE_USE_FUNCTIONS_EMULATOR?: string;
  /** reCAPTCHA v3 site key registered for App Check (starts with "6L"). App Check is off without it. */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  /** App Check debug token for local development; register it in the Firebase console. Never commit. */
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
