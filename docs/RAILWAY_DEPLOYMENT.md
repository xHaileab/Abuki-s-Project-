# Railway Deployment

This repo is set up as two Railway services from the same GitHub repository.

## Services

Create two services:

| Service | Railway root directory | Config file |
| --- | --- | --- |
| Backend API | `backend` | `backend/railway.json` |
| Admin web app | `admin` | `admin/railway.json` |

Both configs use Railway's Railpack builder, explicit start commands, healthchecks, and restart-on-failure policy.

## Backend Service

Required variables:

```text
ADMIN_TOKEN=<long-random-token>
```

Recommended variables:

```text
CORS_ORIGIN=https://<your-admin-domain>
DREAM_DB_PATH=/data/dream.db
```

Optional variables:

```text
GEBETA_API_KEY=<your-gebeta-key>
```

If `DREAM_DB_PATH=/data/dream.db` is used, attach a Railway volume mounted at `/data`. Without a volume, SQLite data can be lost across redeploys.

## Admin Service

Required variables:

```text
VITE_BACKEND_URL=https://<your-backend-domain>
```

Optional variables:

```text
VITE_GEBETA_API_KEY=<your-gebeta-key>
```

After the backend has a public Railway domain, set `VITE_BACKEND_URL`, then redeploy the admin service so Vite bakes the URL into the static bundle.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`/`master`:

- validates the Railway config files
- installs and tests the backend
- audits and builds the admin app
- analyzes and tests the Flutter app

## Optional Railway Deploy Workflow

`.github/workflows/railway-deploy.yml` is disabled by default. To enable deployment after CI succeeds, add these GitHub repository variables:

```text
RAILWAY_DEPLOY=true
RAILWAY_PROJECT_ID=<railway-project-id>
RAILWAY_ENVIRONMENT=production
RAILWAY_BACKEND_SERVICE=<backend-service-name-or-id>
RAILWAY_ADMIN_SERVICE=<admin-service-name-or-id>
```

Add this GitHub repository secret:

```text
RAILWAY_TOKEN=<railway-project-token>
```

The workflow deploys `backend` and `admin` separately with `railway up --path-as-root --ci`, so each service receives only its own directory.

## Telebirr QR

Set the payment QR through the admin Config page after deploy. Use a real merchant QR image URL in `telebirrQrImageUrl`; the app intentionally shows a placeholder until a real QR is configured.

## Mobile Release Against Railway

Build the Android APK against the deployed backend:

```bash
cd flutter_app
flutter build apk --release --dart-define=BACKEND_URL=https://<your-backend-domain>
```

## Railway References

- Railway Config as Code: https://docs.railway.com/config-as-code/reference
- Railway monorepo deployments: https://docs.railway.com/deployments/monorepo
- Railway CLI deployment: https://docs.railway.com/cli/deploying
