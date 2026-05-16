# Smart Property Platform

Government-style property marketplace for Bhutan NDI verified users. The app supports property document submission, admin review, ERC-6909 share minting, fractional purchase, resale listings, and on-chain lease records.

## Project Structure

```txt
backend/    Bun API, MongoDB storage, NDI events, Privy wallets, IPFS upload, chain orchestration
contracts/  SmartProperty6909 Solidity contract
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
cd backend
bun build src/server.mjs --target=bun --outdir .backend-check
```

Remove `.backend-check` after the backend bundle check.
