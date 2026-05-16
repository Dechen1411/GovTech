# Smart Property Platform Backend

Local Bun-compatible API for the Smart Property Platform.

```bash
# Preferred runtime from the spec
bun run dev

# Local fallback if Bun is not installed
npm run dev:node
```

The server listens on `http://localhost:4001`.

Data storage:

- With `MONGODB_URI` set, the backend stores data in MongoDB collections.
- Without `MONGODB_URI`, it falls back to local demo storage at `backend/data/db.json`.
- Uploaded property documents are encrypted before storage. With `DOCUMENT_STORAGE_DRIVER=ipfs` and `PINATA_JWT` set, encrypted files are pinned to IPFS through Pinata; otherwise they are saved locally at `backend/data/documents`.

## MVC layout

```txt
src/
  server.mjs              # HTTP entry point
  app.mjs                 # request parsing, health, shared error handling
  routes/                 # URL to controller mapping
  controllers/            # request/response handlers
  services/               # business logic: NDI, wallet, ERC-6909, documents, admin
  models/                 # serializers and local data access helpers
  db/                     # local JSON store and seed data
  config/                 # constants and runtime paths
  utils/                  # HTTP, errors, value normalization
```

Environment knobs:

- `PORT` - API port, default `4001`
- `MONGODB_URI` - MongoDB Atlas/local connection string. Encode special password characters, for example `@` becomes `%40`.
- `MONGODB_DB_NAME` - database name, default `smart_property_platform`
- `MONGODB_TLS_ALLOW_INVALID_HOSTNAMES` - demo-only workaround for Bun/Atlas hostname certificate errors; keep `false` unless local MongoDB TLS fails
- `MONGODB_FALLBACK_TO_LOCAL` - demo-only fallback to `backend/data/db.json` when Atlas is unreachable; keep `false` for production
- `DOCUMENT_ENCRYPTION_KEY` - passphrase used to derive the AES-256-GCM key for uploaded documents
- `DOCUMENT_STORAGE_DRIVER` - `ipfs` for IPFS document storage, otherwise local encrypted files
- `PINATA_JWT` - full Pinata JWT used by the backend to pin encrypted document JSON. Copy the JWT value, not only the short API key. Never expose it in React.
- `PINATA_FILE_API_URL` - Pinata file pin endpoint used for public property photos
- `PINATA_NETWORK` - Pinata upload network for the v3 files endpoint, default `public`; the default JSON pin endpoint stores encrypted docs on public IPFS
- `PINATA_GATEWAY_URL` - Pinata gateway host, for example `peach-decisive-ant-562.mypinata.cloud`
- `IPFS_API_URL`, `IPFS_API_TOKEN` - optional Kubo-compatible IPFS API fallback instead of Pinata
- `CHAIN_RPC_URL` - Sepolia RPC URL for contract writes
- `SMART_PROPERTY_CONTRACT_ADDRESS` - deployed `SmartProperty6909` contract address. `SMART_CONTRACT_ADDRESS` is also supported. Redeploy after contract changes such as on-chain leasing.
- `CONTRACT_ADMIN_PRIVATE_KEY` - private key of the wallet that deployed the contract. `PRIVATE_KEY` is also supported.
- `PRIVY_APP_ID`, `PRIVY_APP_SECRET` - Privy REST API credentials used to create a server-side Ethereum EOA after NDI verification
- `PRIVY_API_BASE` - default `https://api.privy.io/v1`
- `ADMIN_DEMO_MODE` - set to `true` only for demo NDI/hackathon runs where there is no stable officer holder DID; any successful NDI login from `/admin-login` becomes admin
- `ADMIN_HOLDER_DIDS` - comma-separated Bhutan NDI holder DID allowlist for officers who can enter the admin dashboard without a browser wallet signature
- `ADMIN_ID_NUMBER_HASHES` - comma-separated SHA-256 hashes of approved officer ID numbers; use this instead of storing raw ID numbers
- `ADMIN_WALLET_ADDRESSES` - optional comma-separated platform wallet allowlist; useful if approving an officer by their generated Privy EOA address
- `NDI_CLIENT_ID`, `NDI_CLIENT_SECRET` - Bhutan NDI verifier credentials
- `NDI_AUTH_BASE` - default `https://staging.bhutanndi.com`
- `NDI_API_BASE` - default `https://demo-client.bhutanndi.com`
- `NDI_FOUNDATIONAL_SCHEMA` - schema used for Full Name and ID Number proof attributes
- `NDI_NATS_URL`, `NDI_NATS_NKEY_SEED` - NATS transport for real proof result events after the wallet approves

Lease endpoints:

- `GET /api/leases?status=ALL` - list lease records
- `POST /api/leases` - create an on-chain lease agreement and lock the lessor's leased shares
- `PATCH /api/leases/:id/complete` / `PATCH /api/leases/:id/cancel` - close an active on-chain lease
