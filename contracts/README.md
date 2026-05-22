# Smart Property Contracts

Hardhat 3 workspace for `SmartProperty6909`.

## Commands

```bash
npm run build:contracts
npm run test:contracts
npm run deploy:contracts
```

For Sepolia, set the same chain environment values used by the backend before running with `--network sepolia`:

```bash
$env:CHAIN_RPC_URL="https://..."
$env:CONTRACT_ADMIN_PRIVATE_KEY="0x..."
npm run deploy:contracts -- --network sepolia
```

Copy the deployed address into `backend/.env` as `SMART_PROPERTY_CONTRACT_ADDRESS`.

## Sepolia

The current Sepolia deployment is recorded at `contracts/deployments/sepolia.json`.
