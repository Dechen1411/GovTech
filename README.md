# Smart Property Platform

Government-style digital property service pilot for Bhutan NDI verified users. The app demonstrates property document submission, officer review, off-chain audit logs, encrypted document references, and on-chain proof anchoring while keeping personal identity details off-chain.

Marketplace, fractional ownership, resale, and lease features exist as optional modules, but the recommended pilot positioning is property proof and officer review first.

## Project Structure

```txt
backend/    Bun API, MongoDB storage, NDI events, Privy wallets, IPFS upload, chain orchestration
contracts/  Hardhat workspace for the SmartProperty6909 Solidity contract
frontend/   React/Vite user interface
```

## Local Run

Start the backend:

```bash
npm run dev:backend
```

Start the frontend:

```bash
npm run dev:frontend
```

Default local URLs:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4001`
- Health check: `http://localhost:4001/health`

## Deploy

Render deployment is configured with `render.yaml`.

```txt
Backend:  govtech-smart-property-api
Frontend: govtech-smart-property-web
```

See `docs/deploy-render.md` for the Render Blueprint flow and required environment variables.

## Pilot Proposal

Use these documents when presenting the project to agencies:

- `docs/pilot-proposal.md` - polished 90-day pilot proposal.
- `docs/pilot-demo-script.md` - demo narrative and likely Q&A.

## Required Backend Environment

Create `backend/.env` from `backend/.env.example`.

Important production-style values:

- `MONGODB_URI`
- `DOCUMENT_ENCRYPTION_KEY`
- `DOCUMENT_STORAGE_DRIVER=ipfs`
- `PINATA_JWT`
- `PINATA_GATEWAY_URL`
- `CHAIN_RPC_URL`
- `SMART_PROPERTY_CONTRACT_ADDRESS`
- `CONTRACT_ADMIN_PRIVATE_KEY`
- `NDI_CLIENT_ID`
- `NDI_CLIENT_SECRET`
- `NDI_NATS_NKEY_SEED`
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `ADMIN_HOLDER_DIDS` or `ADMIN_ID_NUMBER_HASHES`

Never commit real `.env` files, private keys, JWTs, MongoDB passwords, or NDI credentials.

## Verification

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run test
npm run build:contracts
npm run test:contracts
cd backend
bun build src/server.mjs --target=bun --outdir .backend-check
```

Remove `.backend-check` after the backend bundle check.
