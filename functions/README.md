# Forge Cloud Functions

One callable function, `ai`, is the only path from Forge to Claude. The browser
sends a whitelisted `mode` plus typed input (see `src/contract.ts`); the server
builds the prompt, enforces a per-user daily budget, and either streams text or
returns schema-validated JSON.

- Model: `claude-sonnet-5-5` (change `AI_MODEL` in `src/index.ts`)
- Daily cap: `$1.50` per user by default (`AI_DAILY_CAP_USD` env var)
- Spend is recorded in `users/{uid}/aiUsage/{UTC date}` (read-only for clients)
- Refused requests are rerouted with server-side fallbacks (`fallbacks: "default"`)

## One-time setup

1. Put the Firebase project on the **Blaze** plan (Cloud Functions requires it;
   personal use stays within the free tier). Add a budget alert in Google Cloud Billing.
2. Create an API key at https://console.anthropic.com.
3. Store it as a secret (never in `.env`):

   ```bash
   npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY
   ```

4. Deploy:

   ```bash
   npm --prefix functions ci
   npx firebase-tools deploy --only functions,firestore:rules
   ```

## Local development

```bash
npm --prefix functions run build
echo "ANTHROPIC_API_KEY=sk-ant-..." > functions/.secret.local   # git-ignored
npx firebase-tools emulators:start --only functions
```

Then start the web app with `VITE_USE_FUNCTIONS_EMULATOR=true` in `.env.local`.

## CI

`.github/workflows/firebase-hosting-merge.yml` deploys functions and rules when the
`FIREBASE_DEPLOY_SERVICE_ACCOUNT` secret exists (a service account JSON with
Cloud Functions Admin, Service Account User, Firebase Rules Admin and Artifact
Registry Writer roles).
