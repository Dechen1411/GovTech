# Deploying To Render

This repo includes a Render Blueprint at `render.yaml`.

## One-Click Blueprint Flow

1. Push `main` to GitHub.
2. In Render, choose **New > Blueprint**.
3. Connect the `Dechen1411/smart-property` repository.
4. Keep the default Blueprint file path: `render.yaml`.
5. Fill every prompted `sync: false` environment variable.
6. Create the Blueprint.

Render will create:

- `govtech-smart-property-api` - Bun backend web service.
- `govtech-smart-property-web` - Vite static frontend.

## Important Environment Values

Use the deployed Sepolia contract address:

```txt
SMART_CONTRACT_ADDRESS=0xAc10699Cc1198516c79f7670b86F4A235127f86c
```

The frontend is configured to call:

```txt
VITE_API_BASE_URL=https://govtech-smart-property-api.onrender.com
```

If Render assigns a different backend hostname, update `VITE_API_BASE_URL` on the static site and redeploy it.

## Manual Backend Settings

If you deploy without the Blueprint:

```txt
Root Directory: backend
Build Command: bun install
Start Command: bun src/server.mjs
Health Check Path: /health
```

## Manual Frontend Settings

```txt
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Set:

```txt
VITE_API_BASE_URL=https://your-render-backend-url
```
