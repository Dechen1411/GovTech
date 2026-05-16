import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, JsonRpcProvider, Wallet, getAddress } from "ethers";
import { CHAIN_RPC_URL, CONTRACT_ADMIN_PRIVATE_KEY, SMART_PROPERTY_CONTRACT_ADDRESS, USE_CHAIN } from "../config/constants.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ABI_PATH = path.resolve(__dirname, "..", "contracts", "SmartProperty6909.abi.json");

let abiCache = null;
let providerInstance = null;
let signerInstance = null;
let contractInstance = null;

const loadAbi = () => {
  if (!abiCache) {
    abiCache = JSON.parse(readFileSync(ABI_PATH, "utf8"));
  }
  return abiCache;
};

const normalizedPrivateKey = () => {
  if (!CONTRACT_ADMIN_PRIVATE_KEY) {
    return "";
  }
  return CONTRACT_ADMIN_PRIVATE_KEY.startsWith("0x") ? CONTRACT_ADMIN_PRIVATE_KEY : `0x${CONTRACT_ADMIN_PRIVATE_KEY}`;
};

export const isChainConfigured = () => USE_CHAIN;

export const getProvider = () => {
  if (!isChainConfigured()) {
    return null;
  }
  if (!providerInstance) {
    providerInstance = new JsonRpcProvider(CHAIN_RPC_URL);
  }
  return providerInstance;
};

export const getAdminSigner = () => {
  if (!isChainConfigured()) {
    return null;
  }
  if (!signerInstance) {
    signerInstance = new Wallet(normalizedPrivateKey(), getProvider());
  }
  return signerInstance;
};

export const getSmartPropertyContract = () => {
  if (!isChainConfigured()) {
    return null;
  }
  if (!contractInstance) {
    contractInstance = new Contract(getAddress(SMART_PROPERTY_CONTRACT_ADDRESS), loadAbi(), getAdminSigner());
  }
  return contractInstance;
};

export const getChainStatus = async () => {
  if (!isChainConfigured()) {
    return { configured: false };
  }

  const provider = getProvider();
  const signer = getAdminSigner();
  const contract = getSmartPropertyContract();
  const [network, admin, nextTokenId] = await Promise.all([provider.getNetwork(), contract.admin(), contract.nextTokenId()]);

  return {
    configured: true,
    chainId: Number(network.chainId),
    networkName: network.name,
    contractAddress: getAddress(SMART_PROPERTY_CONTRACT_ADDRESS),
    signerAddress: await signer.getAddress(),
    contractAdmin: admin,
    adminMatchesSigner: getAddress(admin) === getAddress(await signer.getAddress()),
    nextTokenId: nextTokenId.toString(),
  };
};

export const setVerifiedWalletOnChain = async (wallet, verified = true) => {
  const contract = getSmartPropertyContract();
  if (!contract) {
    return null;
  }

  const tx = await contract.setVerifiedWallet(getAddress(wallet), Boolean(verified));
  const receipt = await tx.wait();
  return {
    txHash: receipt?.hash || tx.hash,
  };
};

export const mintPropertyOnChain = async (owner, shares, documentHash) => {
  const contract = getSmartPropertyContract();
  if (!contract) {
    return null;
  }

  const tokenId = await contract.nextTokenId();
  const tx = await contract.mintProperty(getAddress(owner), BigInt(shares), documentHash);
  const receipt = await tx.wait();
  return {
    tokenId: tokenId.toString(),
    txHash: receipt?.hash || tx.hash,
  };
};

export const createLeaseOnChain = async ({ tokenId, lessorWallet, lesseeWallet, shareAmount, startDate, endDate, rentAmount, depositAmount, termsHash }) => {
  const contract = getSmartPropertyContract();
  if (!contract) {
    return null;
  }

  const leaseId = await contract.nextLeaseId();
  const tx = await contract.createLease(
    BigInt(tokenId),
    getAddress(lessorWallet),
    getAddress(lesseeWallet),
    BigInt(shareAmount),
    BigInt(startDate),
    BigInt(endDate),
    BigInt(rentAmount),
    BigInt(depositAmount),
    termsHash,
  );
  const receipt = await tx.wait();
  return {
    leaseId: leaseId.toString(),
    txHash: receipt?.hash || tx.hash,
  };
};

export const closeLeaseOnChain = async (chainLeaseId, action) => {
  const contract = getSmartPropertyContract();
  if (!contract || !chainLeaseId) {
    return null;
  }

  const tx = action === "cancel" ? await contract.cancelLease(BigInt(chainLeaseId)) : await contract.completeLease(BigInt(chainLeaseId));
  const receipt = await tx.wait();
  return {
    txHash: receipt?.hash || tx.hash,
  };
};
