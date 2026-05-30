# Firebase Deployment

This deployment uses:

- Firebase Hosting for the admin web app
- Cloud Functions for Firebase for the Express API
- Cloud Firestore for durable products, ads, config, and orders

Local development still uses SQLite through `backend/src/store.js`. Firebase Functions sets `DREAM_STORE=firestore` in `backend/src/firebase.js`.

## One-Time Firebase Setup

Create or select a Firebase project, then enable:

- Firestore database
- Firebase Hosting
- Cloud Functions

Cloud Functions normally requires the Firebase Blaze/pay-as-you-go plan. The app is configured with low `maxInstances` and should stay small for one tester, but set a budget alert in Google Cloud before production use. If you need a strict no-billing Spark-plan setup, the backend would need to be rewritten to use client SDKs plus Firebase Auth and Firestore rules instead of Express on Cloud Functions.

Copy `.firebaserc.example` to `.firebaserc` and set your project id:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

Do not commit `.firebaserc` if you want to keep the project id private.

## Backend Environment

Create `backend/.env.<project-id>` locally before deploying Functions:

```text
ADMIN_TOKEN=<long-random-token>
CORS_ORIGIN=https://<project-id>.web.app,https://<project-id>.firebaseapp.com
GEBETA_API_KEY=<optional-gebeta-key>
```

If your project uses a named Firestore database, also set:

```text
FIRESTORE_DATABASE_ID=<database-id>
```

The admin app is served from Firebase Hosting, so it can call `/api/...` through Hosting rewrites without `VITE_BACKEND_URL`.

Current deployed site:

```text
https://dream-direct-480614.web.app
```

## Deploy From This Machine

Install the Firebase CLI, authenticate, then deploy:

```bash
npm install --global firebase-tools
firebase login
cd admin
npm ci
npm run build
cd ..
firebase deploy --only hosting,functions
```

After deploy, use this backend URL for the Flutter release:

```text
https://<project-id>.web.app
```

Build the APK:

```bash
cd flutter_app
flutter build apk --release --dart-define=BACKEND_URL=https://<project-id>.web.app
```

## GitHub Actions Deploy

`.github/workflows/firebase-deploy.yml` is disabled by default. To enable deploy-after-CI, add:

Repository variable:

```text
FIREBASE_DEPLOY=true
FIREBASE_PROJECT_ID=<project-id>
FIRESTORE_DATABASE_ID=<optional-database-id>
FIREBASE_CORS_ORIGIN=https://<project-id>.web.app,https://<project-id>.firebaseapp.com
```

Repository secret:

```text
FIREBASE_SERVICE_ACCOUNT=<service-account-json>
FIREBASE_ADMIN_TOKEN=<long-random-admin-token>
GEBETA_API_KEY=<optional-gebeta-key>
```

The service account must be able to deploy Hosting and Functions, enable/use Cloud Run, Cloud Build, Artifact Registry, Eventarc, Pub/Sub, and act as the Functions runtime service account.

## MCP

The Firebase MCP server is configured in Codex at:

```text
C:\Users\Haileab Gezatodus\.codex\config.toml
```

It runs:

```bash
npx -y firebase-tools@15.18.0 mcp --dir C:\Development\Abuki-s-Project-
```

Restart Codex to make the MCP tools available in a new session.

## Firebase References

- Firebase MCP server: https://firebase.google.com/docs/ai-assistance/mcp-server
- Firebase Hosting rewrites: https://firebase.google.com/docs/hosting/full-config
- Cloud Functions runtimes and options: https://firebase.google.com/docs/functions/manage-functions
- Cloud Functions environment variables: https://firebase.google.com/docs/functions/config-env
