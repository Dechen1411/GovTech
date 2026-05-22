import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const DOC_HASH = ethers.id("approved-property-document");
const TERMS_HASH = ethers.id("lease-terms-v1");

describe("SmartProperty6909", function () {
  async function deployContract() {
    const [admin, owner, buyer, lessee, stranger] = await ethers.getSigners();
    const smartProperty = await ethers.deployContract("SmartProperty6909");

    return { admin, owner, buyer, lessee, stranger, smartProperty };
  }

  async function deployMintedProperty() {
    const context = await deployContract();
    const { buyer, lessee, owner, smartProperty } = context;

    await smartProperty.setVerifiedWallet(owner.address, true);
    await smartProperty.setVerifiedWallet(buyer.address, true);
    await smartProperty.setVerifiedWallet(lessee.address, true);
    await smartProperty.mintProperty(owner.address, 100n, DOC_HASH);

    return context;
  }

  it("sets the deployer as admin", async function () {
    const { admin, smartProperty } = await deployContract();

    expect(await smartProperty.admin()).to.equal(admin.address);
  });

  it("only allows the admin to verify wallets", async function () {
    const { owner, smartProperty, stranger } = await deployContract();

    await expect(smartProperty.connect(stranger).setVerifiedWallet(owner.address, true)).to.be.revertedWith("ONLY_ADMIN");

    await expect(smartProperty.setVerifiedWallet(owner.address, true))
      .to.emit(smartProperty, "WalletVerificationSet")
      .withArgs(owner.address, true);

    expect(await smartProperty.verifiedWallet(owner.address)).to.equal(true);
  });

  it("mints approved property shares to a verified owner", async function () {
    const { owner, smartProperty } = await deployContract();

    await expect(smartProperty.mintProperty(owner.address, 100n, DOC_HASH)).to.be.revertedWith("OWNER_NOT_VERIFIED");

    await smartProperty.setVerifiedWallet(owner.address, true);

    await expect(smartProperty.mintProperty(owner.address, 100n, DOC_HASH))
      .to.emit(smartProperty, "PropertyMinted")
      .withArgs(1n, owner.address, 100n, DOC_HASH);

    expect(await smartProperty.balanceOf(owner.address, 1n)).to.equal(100n);
    expect(await smartProperty.totalSupply(1n)).to.equal(100n);
    expect(await smartProperty.docHash(1n)).to.equal(DOC_HASH);
  });

  it("requires verified wallets for share transfers", async function () {
    const { buyer, owner, smartProperty, stranger } = await deployMintedProperty();

    await expect(smartProperty.connect(owner).transfer(stranger.address, 1n, 10n)).to.be.revertedWith("TO_NOT_VERIFIED");

    await expect(smartProperty.connect(owner).transfer(buyer.address, 1n, 40n))
      .to.emit(smartProperty, "Transfer")
      .withArgs(owner.address, owner.address, buyer.address, 1n, 40n);

    expect(await smartProperty.balanceOf(owner.address, 1n)).to.equal(60n);
    expect(await smartProperty.balanceOf(buyer.address, 1n)).to.equal(40n);
  });

  it("locks leased shares until the lease is closed", async function () {
    const { buyer, lessee, owner, smartProperty } = await deployMintedProperty();

    await expect(smartProperty.connect(owner).createLease(1n, owner.address, lessee.address, 80n, 1000n, 2000n, 1200n, 300n, TERMS_HASH))
      .to.emit(smartProperty, "LeaseCreated")
      .withArgs(1n, 1n, owner.address, lessee.address, 80n, 1000n, 2000n, 1200n, 300n, TERMS_HASH);

    expect(await smartProperty.activeLeasedShares(owner.address, 1n)).to.equal(80n);

    await expect(smartProperty.connect(owner).transfer(buyer.address, 1n, 30n)).to.be.revertedWith("SHARES_LEASED");

    await smartProperty.connect(owner).transfer(buyer.address, 1n, 20n);
    expect(await smartProperty.balanceOf(owner.address, 1n)).to.equal(80n);

    await expect(smartProperty.connect(lessee).completeLease(1n)).to.emit(smartProperty, "LeaseClosed").withArgs(1n, 2);

    expect(await smartProperty.activeLeasedShares(owner.address, 1n)).to.equal(0n);

    await smartProperty.connect(owner).transfer(buyer.address, 1n, 30n);
    expect(await smartProperty.balanceOf(owner.address, 1n)).to.equal(50n);
  });
});
