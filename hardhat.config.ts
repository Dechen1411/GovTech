import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import { existsSync, readFileSync } from "node:fs";

const loadBackendEnv = () => {
  const envUrl = new URL("./backend/.env", import.meta.url);
  if (!existsSync(envUrl)) {
    return;
  }

  for (const line of readFileSync(envUrl, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
    }
  }

  if (process.env.CONTRACT_ADMIN_PRIVATE_KEY === undefined && process.env.PRIVATE_KEY) {
    process.env.CONTRACT_ADMIN_PRIVATE_KEY = process.env.PRIVATE_KEY;
  }
};

loadBackendEnv();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("CHAIN_RPC_URL"),
      accounts: [configVariable("CONTRACT_ADMIN_PRIVATE_KEY")],
    },
  },
});
