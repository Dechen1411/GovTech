import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartProperty6909Module", (m) => {
  const smartProperty = m.contract("SmartProperty6909");

  return { smartProperty };
});
