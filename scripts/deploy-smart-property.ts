import { network } from "hardhat";

const { ethers, networkName } = await network.create();

console.log(`Deploying SmartProperty6909 to ${networkName}...`);

const smartProperty = await ethers.deployContract("SmartProperty6909");
await smartProperty.waitForDeployment();

const deploymentTx = smartProperty.deploymentTransaction();

console.log(`SmartProperty6909 deployed to ${await smartProperty.getAddress()}`);
if (deploymentTx) {
  console.log(`Deployment tx: ${deploymentTx.hash}`);
}
console.log(`Admin wallet: ${await smartProperty.admin()}`);
