// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SmartProperty6909
/// @notice Minimal ERC-6909-style registry for fractional property ownership.
contract SmartProperty6909 {
    event Transfer(address indexed caller, address indexed from, address indexed to, uint256 id, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id, uint256 amount);
    event OperatorSet(address indexed owner, address indexed operator, bool approved);
    event PropertyMinted(uint256 indexed id, address indexed owner, uint256 totalSupply, bytes32 docHash);
    event WalletVerificationSet(address indexed wallet, bool verified);
    event LeaseCreated(
        uint256 indexed leaseId,
        uint256 indexed tokenId,
        address indexed lessor,
        address lessee,
        uint256 shareAmount,
        uint64 startDate,
        uint64 endDate,
        uint256 rentAmount,
        uint256 depositAmount,
        bytes32 termsHash
    );
    event LeaseClosed(uint256 indexed leaseId, uint8 status);

    address public immutable admin;
    uint256 public nextTokenId = 1;
    uint256 public nextLeaseId = 1;

    enum LeaseStatus {
        NONE,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    struct LeaseAgreement {
        uint256 tokenId;
        address lessor;
        address lessee;
        uint256 shareAmount;
        uint64 startDate;
        uint64 endDate;
        uint256 rentAmount;
        uint256 depositAmount;
        bytes32 termsHash;
        LeaseStatus status;
    }

    mapping(address owner => mapping(uint256 id => uint256 amount)) public balanceOf;
    mapping(address owner => mapping(address spender => mapping(uint256 id => uint256 amount))) public allowance;
    mapping(address owner => mapping(address operator => bool approved)) public isOperator;
    mapping(uint256 id => uint256 supply) public totalSupply;
    mapping(uint256 id => bytes32 hash) public docHash;
    mapping(address wallet => bool verified) public verifiedWallet;
    mapping(uint256 leaseId => LeaseAgreement agreement) public leases;
    mapping(address lessor => mapping(uint256 tokenId => uint256 amount)) public activeLeasedShares;

    modifier onlyAdmin() {
        require(msg.sender == admin, "ONLY_ADMIN");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Mirrors the off-chain NDI proof + wallet signature result.
    /// @dev Do not store holder DIDs or other identity data on-chain.
    function setVerifiedWallet(address wallet, bool verified) external onlyAdmin {
        require(wallet != address(0), "ZERO_WALLET");
        verifiedWallet[wallet] = verified;
        emit WalletVerificationSet(wallet, verified);
    }

    function mintProperty(address owner, uint256 shares, bytes32 documentHash) external onlyAdmin returns (uint256 id) {
        require(owner != address(0), "ZERO_OWNER");
        require(verifiedWallet[owner], "OWNER_NOT_VERIFIED");
        require(shares > 0, "NO_SHARES");
        require(documentHash != bytes32(0), "NO_DOC_HASH");

        id = nextTokenId++;
        totalSupply[id] = shares;
        docHash[id] = documentHash;
        balanceOf[owner][id] = shares;

        emit Transfer(msg.sender, address(0), owner, id, shares);
        emit PropertyMinted(id, owner, shares, documentHash);
    }

    /// @notice Records a lease for a property token without transferring ownership.
    /// @dev termsHash should be a hash of the off-chain lease terms. No personal data should be stored here.
    function createLease(
        uint256 id,
        address lessor,
        address lessee,
        uint256 shareAmount,
        uint64 startDate,
        uint64 endDate,
        uint256 rentAmount,
        uint256 depositAmount,
        bytes32 termsHash
    ) external returns (uint256 leaseId) {
        require(msg.sender == lessor || msg.sender == admin, "NOT_LESSOR_OR_ADMIN");
        require(totalSupply[id] > 0, "UNKNOWN_PROPERTY");
        require(lessor != address(0), "ZERO_LESSOR");
        require(lessee != address(0), "ZERO_LESSEE");
        require(verifiedWallet[lessor], "LESSOR_NOT_VERIFIED");
        require(verifiedWallet[lessee], "LESSEE_NOT_VERIFIED");
        require(shareAmount > 0, "NO_SHARES");
        require(startDate < endDate, "BAD_DATES");
        require(termsHash != bytes32(0), "NO_TERMS_HASH");
        require(balanceOf[lessor][id] >= activeLeasedShares[lessor][id] + shareAmount, "INSUFFICIENT_UNLEASED_SHARES");

        leaseId = nextLeaseId++;
        activeLeasedShares[lessor][id] += shareAmount;
        leases[leaseId] = LeaseAgreement({
            tokenId: id,
            lessor: lessor,
            lessee: lessee,
            shareAmount: shareAmount,
            startDate: startDate,
            endDate: endDate,
            rentAmount: rentAmount,
            depositAmount: depositAmount,
            termsHash: termsHash,
            status: LeaseStatus.ACTIVE
        });

        emit LeaseCreated(leaseId, id, lessor, lessee, shareAmount, startDate, endDate, rentAmount, depositAmount, termsHash);
    }

    function completeLease(uint256 leaseId) external {
        _closeLease(leaseId, LeaseStatus.COMPLETED);
    }

    function cancelLease(uint256 leaseId) external {
        _closeLease(leaseId, LeaseStatus.CANCELLED);
    }

    function _closeLease(uint256 leaseId, LeaseStatus newStatus) internal {
        LeaseAgreement storage agreement = leases[leaseId];
        require(agreement.status == LeaseStatus.ACTIVE, "LEASE_NOT_ACTIVE");
        require(msg.sender == agreement.lessor || msg.sender == agreement.lessee || msg.sender == admin, "NOT_LEASE_PARTY_OR_ADMIN");

        activeLeasedShares[agreement.lessor][agreement.tokenId] -= agreement.shareAmount;
        agreement.status = newStatus;
        emit LeaseClosed(leaseId, uint8(newStatus));
    }

    function approve(address spender, uint256 id, uint256 amount) external returns (bool) {
        require(verifiedWallet[msg.sender], "OWNER_NOT_VERIFIED");
        allowance[msg.sender][spender][id] = amount;
        emit Approval(msg.sender, spender, id, amount);
        return true;
    }

    function setOperator(address operator, bool approved) external returns (bool) {
        require(verifiedWallet[msg.sender], "OWNER_NOT_VERIFIED");
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        return true;
    }

    function transfer(address to, uint256 id, uint256 amount) external returns (bool) {
        _transfer(msg.sender, msg.sender, to, id, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 id, uint256 amount) external returns (bool) {
        if (msg.sender != from && !isOperator[from][msg.sender]) {
            uint256 approved = allowance[from][msg.sender][id];
            require(approved >= amount, "INSUFFICIENT_ALLOWANCE");
            if (approved != type(uint256).max) {
                allowance[from][msg.sender][id] = approved - amount;
                emit Approval(from, msg.sender, id, allowance[from][msg.sender][id]);
            }
        }

        _transfer(msg.sender, from, to, id, amount);
        return true;
    }

    function _transfer(address caller, address from, address to, uint256 id, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        require(verifiedWallet[from], "FROM_NOT_VERIFIED");
        require(verifiedWallet[to], "TO_NOT_VERIFIED");
        require(balanceOf[from][id] >= amount, "INSUFFICIENT_BALANCE");
        require(balanceOf[from][id] - activeLeasedShares[from][id] >= amount, "SHARES_LEASED");

        balanceOf[from][id] -= amount;
        balanceOf[to][id] += amount;

        emit Transfer(caller, from, to, id, amount);
    }
}
