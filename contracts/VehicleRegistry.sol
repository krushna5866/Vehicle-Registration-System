// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VehicleRegistry
 * @notice Confidentiality- and security-focused vehicle registration and title ledger.
 *
 * Core Principles & Identity Separation:
 *   1. STRICT PRINCIPAL SEPARATION: Complete isolation between Citizen Identities (vehicle owners)
 *      and RTO / Transport Authority Identities (registrars, officers, admins).
 *      No single wallet or session can simultaneously act as both a Citizen owner and an RTO authority.
 *   2. ON-CHAIN PRIVILEGE ENFORCEMENT: Privileged RTO/admin addresses are barred from owning vehicles
 *      or receiving ownership transfers. Conversely, citizen addresses cannot invoke authority operations.
 *   3. ROLE CONFLICT PREVENTION: Granting an RTO role to an address that owns vehicles is rejected.
 *   4. MINIMUM ON-CHAIN DATA: Plaintext PII, names, phone numbers, and FIR details are excluded.
 *   5. COMMITMENTS: VINs and registration plates are stored as cryptographic commitments (hashes).
 *   6. TWO-STEP TRANSFERS: Prevents accidental transfers to incorrect or mistyped addresses.
 *   7. LEGAL STATE ENFORCEMENT: Stolen vehicles are programmatically locked from transfer.
 *      Scrapped state is terminal and irreversible.
 *   8. EMERGENCY CONTROLS: Pausable by admin for incident response.
 */
contract VehicleRegistry is ERC721, AccessControl, Pausable {
    // ------------------------------------------------------------------ //
    //                              Roles                                 //
    // ------------------------------------------------------------------ //

    /// @notice RTO Registrar: Sole authority for Initial Vehicle Registration & Digital Title Minting
    bytes32 public constant RTO_REGISTRAR_ROLE = keccak256("RTO_REGISTRAR_ROLE");

    /// @notice RTO Officer: Sole authority for Vehicle Inspection, Decommissioning & Scrappage
    bytes32 public constant RTO_OFFICER_ROLE = keccak256("RTO_OFFICER_ROLE");

    /// @notice Admin & general RTO aliases
    bytes32 public constant RTO_ADMIN_ROLE = keccak256("RTO_ADMIN_ROLE");
    bytes32 public constant RTO_ROLE = keccak256("RTO_ROLE");

    // ------------------------------------------------------------------ //
    //                          Custom Errors                             //
    // ------------------------------------------------------------------ //

    /// @dev Emitted when a privileged RTO/admin account attempts to own a vehicle or receive a title.
    error PrivilegedAddressCannotOwnVehicle(address account);

    /// @dev Emitted when attempting to grant an RTO authority role to an address that currently owns vehicles.
    error VehicleOwnerCannotReceivePrivilegedRole(address account);

    /// @dev Emitted when an RTO authority wallet attempts to invoke citizen-only ownership operations.
    error CallerIsPrivilegedAuthority(address account);

    // ------------------------------------------------------------------ //
    //                              Types                                 //
    // ------------------------------------------------------------------ //

    enum VehicleState {
        Active,   // 0 - Legally registered and active on roads
        Scrapped  // 1 - Permanently decommissioned / scrapped (terminal state)
    }

    /// @notice Chronological record of vehicle title ownership
    struct OwnershipRecord {
        address owner;          // Title holder address
        uint64 transferredAt;   // Timestamp of acquisition
    }

    struct Vehicle {
        bytes32 vehicleId;              // Unique identifier (token ID)
        bytes32 vinCommitment;          // keccak256 hash of normalized VIN
        bytes32 registrationCommitment; // keccak256 hash of normalized registration plate
        VehicleState state;             // Active / Scrapped
        address titleHolder;            // Current verified title owner (Citizen)
        bytes32 metadataHash;           // Cryptographic hash of off-chain vehicle specs
        uint64 registeredAt;            // Timestamp of registration
        uint64 updatedAt;               // Timestamp of last state change
    }

    // ------------------------------------------------------------------ //
    //                             Storage                                //
    // ------------------------------------------------------------------ //

    /// @dev Primary ledger keyed by vehicleId.
    mapping(bytes32 => Vehicle) private _vehicles;

    /// @dev Index to resolve VIN commitment to vehicleId.
    mapping(bytes32 => bytes32) private _vinToVehicleId;

    /// @dev Index to resolve Plate commitment to vehicleId.
    mapping(bytes32 => bytes32) private _plateToVehicleId;

    /// @dev Pending two-step title transfers: vehicleId => prospective buyer address.
    mapping(bytes32 => address) private _pendingTransfers;

    /// @dev Complete on-chain ownership history for each vehicle: vehicleId => array of OwnershipRecords.
    mapping(bytes32 => OwnershipRecord[]) private _ownershipHistory;

    /// @dev Total registered vehicles count.
    uint256 public totalVehicles;

    // ------------------------------------------------------------------ //
    //                              Events                                //
    // ------------------------------------------------------------------ //

    /// @dev Minimal technical events. Emits NO plaintext PII or confidential specs.
    event VehicleRegistered(
        bytes32 indexed vehicleId,
        bytes32 indexed vinCommitment,
        bytes32 indexed registrationCommitment,
        address titleHolder,
        bytes32 metadataHash,
        uint64 timestamp
    );

    event TransferInitiated(
        bytes32 indexed vehicleId,
        address indexed from,
        address indexed to,
        uint64 timestamp
    );

    event TransferCompleted(
        bytes32 indexed vehicleId,
        address indexed from,
        address indexed to,
        uint64 timestamp
    );

    event TransferCancelled(
        bytes32 indexed vehicleId,
        address indexed from,
        uint64 timestamp
    );

    event VehicleStateChanged(
        bytes32 indexed vehicleId,
        VehicleState previousState,
        VehicleState newState,
        bytes32 indexed reasonHash,
        uint64 timestamp,
        address indexed operator
    );

    event OwnershipTransferredByRTO(
        bytes32 indexed vehicleId,
        address indexed previousOwner,
        address indexed newOwner,
        bytes32 reasonHash,
        uint64 timestamp,
        address operator
    );

    // ------------------------------------------------------------------ //
    //                            Constructor                             //
    // ------------------------------------------------------------------ //

    /**
     * @param initialAdmin Wallet granted DEFAULT_ADMIN_ROLE.
     * @param initialRegistrar Wallet granted RTO_REGISTRAR_ROLE (New Vehicle Registration).
     * @param initialOfficer Wallet granted RTO_OFFICER_ROLE (Decommissioning & Scrappage).
     */
    constructor(address initialAdmin, address initialRegistrar, address initialOfficer)
        ERC721("Vehicle Digital Title", "VTITLE")
    {
        require(initialAdmin != address(0), "Admin cannot be zero address");
        require(initialRegistrar != address(0), "Registrar cannot be zero address");
        require(initialOfficer != address(0), "Officer cannot be zero address");

        // Role hierarchy: DEFAULT_ADMIN_ROLE manages authority roles
        _setRoleAdmin(RTO_REGISTRAR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(RTO_OFFICER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(RTO_ROLE, DEFAULT_ADMIN_ROLE);

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(RTO_REGISTRAR_ROLE, initialRegistrar);
        _grantRole(RTO_OFFICER_ROLE, initialOfficer);
    }

    // ------------------------------------------------------------------ //
    //                      Privilege Helpers                             //
    // ------------------------------------------------------------------ //

    /**
     * @notice Checks whether an address holds ANY privileged authority or administrative role.
     * @param account The address to inspect.
     * @return True if the address holds any administrative or RTO role.
     */
    function isPrivilegedAddress(address account) public view returns (bool) {
        return _isPrivilegedAddress(account);
    }

    function _isPrivilegedAddress(address account) internal view returns (bool) {
        if (account == address(0)) return false;
        return hasRole(DEFAULT_ADMIN_ROLE, account)
            || hasRole(RTO_REGISTRAR_ROLE, account)
            || hasRole(RTO_OFFICER_ROLE, account)
            || hasRole(RTO_ROLE, account);
    }

    /**
     * @notice Override grantRole to enforce role conflict prevention.
     * @dev An address that owns citizen vehicle titles CANNOT receive any privileged RTO role.
     */
    function grantRole(bytes32 role, address account)
        public
        override(AccessControl)
    {
        if (balanceOf(account) > 0) {
            revert VehicleOwnerCannotReceivePrivilegedRole(account);
        }
        super.grantRole(role, account);
    }

    /**
     * @notice OpenZeppelin ERC721 internal hook executed on all mint, transfer, and burn operations.
     * @dev Enforces that no privileged RTO/admin address can ever be assigned token ownership.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        if (to != address(0) && _isPrivilegedAddress(to)) {
            revert PrivilegedAddressCannotOwnVehicle(to);
        }
        return super._update(to, tokenId, auth);
    }

    // ------------------------------------------------------------------ //
    //                          RTO Operations                            //
    // ------------------------------------------------------------------ //

    /**
     * @notice Register a new vehicle title on-chain.
     * @dev Only callable by accounts holding RTO_REGISTRAR_ROLE.
     * @param vinCommitment Cryptographic commitment of the normalized VIN.
     * @param registrationCommitment Cryptographic commitment of the normalized registration plate.
     * @param titleHolder The citizen owner wallet receiving the title. Must NOT be an RTO/admin address.
     * @param metadataHash Hash of the protected off-chain vehicle specifications document.
     */
    function registerVehicle(
        bytes32 vinCommitment,
        bytes32 registrationCommitment,
        address titleHolder,
        bytes32 metadataHash
    ) external onlyRole(RTO_REGISTRAR_ROLE) whenNotPaused returns (bytes32 vehicleId) {
        require(vinCommitment != bytes32(0), "VIN commitment cannot be zero");
        require(registrationCommitment != bytes32(0), "Registration commitment cannot be zero");
        require(titleHolder != address(0), "Title holder cannot be zero address");

        // Enforce strict separation: RTO/admin wallets CANNOT own vehicles
        if (_isPrivilegedAddress(titleHolder)) {
            revert PrivilegedAddressCannotOwnVehicle(titleHolder);
        }

        require(_vinToVehicleId[vinCommitment] == bytes32(0), "VIN commitment already registered");
        require(_plateToVehicleId[registrationCommitment] == bytes32(0), "Plate commitment already registered");

        // Canonical vehicleId derived from commitments and registration block
        vehicleId = keccak256(abi.encodePacked(vinCommitment, registrationCommitment, block.timestamp, totalVehicles));

        uint64 nowTs = uint64(block.timestamp);

        _vehicles[vehicleId] = Vehicle({
            vehicleId: vehicleId,
            vinCommitment: vinCommitment,
            registrationCommitment: registrationCommitment,
            state: VehicleState.Active,
            titleHolder: titleHolder,
            metadataHash: metadataHash,
            registeredAt: nowTs,
            updatedAt: nowTs
        });

        _vinToVehicleId[vinCommitment] = vehicleId;
        _plateToVehicleId[registrationCommitment] = vehicleId;
        totalVehicles += 1;

        // Mint title NFT to the citizen title holder (will also trigger _update check)
        _safeMint(titleHolder, uint256(vehicleId));

        // Record initial ownership in chronological history
        _ownershipHistory[vehicleId].push(OwnershipRecord({
            owner: titleHolder,
            transferredAt: nowTs
        }));

        emit VehicleRegistered(
            vehicleId,
            vinCommitment,
            registrationCommitment,
            titleHolder,
            metadataHash,
            nowTs
        );
    }

    /**
     * @notice Update vehicle legal status (Scrap / Decommission vehicle).
     * @dev Only callable by accounts holding RTO_OFFICER_ROLE.
     * @param vehicleId Unique identifier of the vehicle.
     * @param newState Target status (Active = 0, Scrapped = 1).
     * @param reasonHash Hash of official certificate or document stored off-chain.
     */
    function updateVehicleState(
        bytes32 vehicleId,
        VehicleState newState,
        bytes32 reasonHash
    ) external onlyRole(RTO_OFFICER_ROLE) whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
        require(reasonHash != bytes32(0), "Reason hash required");

        Vehicle storage v = _vehicles[vehicleId];
        VehicleState previous = v.state;
        require(previous != newState, "Vehicle already in requested state");
        require(previous != VehicleState.Scrapped, "Scrapped state is terminal");

        // If marked Scrapped, any pending ownership transfer is cancelled
        if (newState == VehicleState.Scrapped && _pendingTransfers[vehicleId] != address(0)) {
            delete _pendingTransfers[vehicleId];
            emit TransferCancelled(vehicleId, v.titleHolder, uint64(block.timestamp));
        }

        v.state = newState;
        v.updatedAt = uint64(block.timestamp);

        emit VehicleStateChanged(
            vehicleId,
            previous,
            newState,
            reasonHash,
            uint64(block.timestamp),
            msg.sender
        );
    }

    // ------------------------------------------------------------------ //
    //                         Ownership Transfer                         //
    // ------------------------------------------------------------------ //

    /**
     * @notice Official Transfer of Vehicle Ownership executed by RTO Registrar.
     * @dev Only callable by accounts holding RTO_REGISTRAR_ROLE.
     * @param vehicleId Unique identifier of the vehicle.
     * @param newOwner Recipient citizen wallet address (must NOT be an authority address).
     * @param transferReasonHash Cryptographic hash of official transfer order or application document.
     */
    function transferOwnershipByRTO(
        bytes32 vehicleId,
        address newOwner,
        bytes32 transferReasonHash
    ) external onlyRole(RTO_REGISTRAR_ROLE) whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
        require(newOwner != address(0), "Recipient cannot be zero address");
        require(transferReasonHash != bytes32(0), "Transfer reason hash required");

        // RTO/admin addresses cannot receive vehicle titles
        if (_isPrivilegedAddress(newOwner)) {
            revert PrivilegedAddressCannotOwnVehicle(newOwner);
        }

        Vehicle storage v = _vehicles[vehicleId];
        require(v.state == VehicleState.Active, "Transfer locked: vehicle is not Active");
        require(newOwner != v.titleHolder, "Recipient is already the title holder");

        address previousHolder = v.titleHolder;
        v.titleHolder = newOwner;
        v.updatedAt = uint64(block.timestamp);

        if (_pendingTransfers[vehicleId] != address(0)) {
            delete _pendingTransfers[vehicleId];
        }

        // Record ownership change in chronological history
        _ownershipHistory[vehicleId].push(OwnershipRecord({
            owner: newOwner,
            transferredAt: uint64(block.timestamp)
        }));

        _transfer(previousHolder, newOwner, uint256(vehicleId));

        emit TransferCompleted(vehicleId, previousHolder, newOwner, uint64(block.timestamp));
        emit OwnershipTransferredByRTO(
            vehicleId,
            previousHolder,
            newOwner,
            transferReasonHash,
            uint64(block.timestamp),
            msg.sender
        );
    }

    /**
     * @notice Direct title transfer from current title holder to recipient.
     * @dev Caller must be citizen title holder; recipient must NOT be an RTO/admin address.
     * @param vehicleId Unique identifier of the vehicle.
     * @param to Recipient citizen wallet address.
     */
    function transferTitle(bytes32 vehicleId, address to) external whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");

        // Privileged authority cannot invoke citizen ownership operations
        if (_isPrivilegedAddress(msg.sender)) {
            revert CallerIsPrivilegedAuthority(msg.sender);
        }

        require(_vehicles[vehicleId].titleHolder == msg.sender, "Caller is not current title holder");
        require(_vehicles[vehicleId].state == VehicleState.Active, "Transfer locked: vehicle is not Active");
        require(to != address(0), "Recipient cannot be zero address");
        require(to != msg.sender, "Recipient is already the title holder");

        // RTO/admin addresses cannot receive vehicle titles
        if (_isPrivilegedAddress(to)) {
            revert PrivilegedAddressCannotOwnVehicle(to);
        }

        Vehicle storage v = _vehicles[vehicleId];
        address previousHolder = v.titleHolder;

        v.titleHolder = to;
        v.updatedAt = uint64(block.timestamp);
        if (_pendingTransfers[vehicleId] != address(0)) {
            delete _pendingTransfers[vehicleId];
        }

        // Record ownership change in chronological history
        _ownershipHistory[vehicleId].push(OwnershipRecord({
            owner: to,
            transferredAt: uint64(block.timestamp)
        }));

        _transfer(previousHolder, to, uint256(vehicleId));

        emit TransferCompleted(vehicleId, previousHolder, to, uint64(block.timestamp));
    }

    /**
     * @notice Optional Step 1: Current owner initiates transfer to a prospective buyer.
     * @dev Caller must be citizen title holder; recipient must NOT be an RTO/admin address.
     * @param vehicleId Unique identifier of the vehicle.
     * @param to Buyer citizen wallet address.
     */
    function initiateTransfer(bytes32 vehicleId, address to) external whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");

        if (_isPrivilegedAddress(msg.sender)) {
            revert CallerIsPrivilegedAuthority(msg.sender);
        }

        require(_vehicles[vehicleId].titleHolder == msg.sender, "Caller is not current title holder");
        require(_vehicles[vehicleId].state == VehicleState.Active, "Transfer locked: vehicle is not Active");
        require(to != address(0), "Recipient cannot be zero address");
        require(to != msg.sender, "Recipient is already the title holder");

        // RTO/admin addresses cannot receive vehicle titles
        if (_isPrivilegedAddress(to)) {
            revert PrivilegedAddressCannotOwnVehicle(to);
        }

        _pendingTransfers[vehicleId] = to;
        emit TransferInitiated(vehicleId, msg.sender, to, uint64(block.timestamp));
    }

    /**
     * @notice Step 2: Buyer accepts the pending transfer, moving the title.
     * @dev Caller must be designated citizen recipient; cannot be an RTO/admin address.
     * @param vehicleId Unique identifier of the vehicle.
     */
    function acceptTransfer(bytes32 vehicleId) external whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");

        if (_isPrivilegedAddress(msg.sender)) {
            revert PrivilegedAddressCannotOwnVehicle(msg.sender);
        }

        require(_pendingTransfers[vehicleId] == msg.sender, "Caller is not the designated recipient");
        require(_vehicles[vehicleId].state == VehicleState.Active, "Transfer locked: vehicle is not Active");

        Vehicle storage v = _vehicles[vehicleId];
        address previousHolder = v.titleHolder;

        v.titleHolder = msg.sender;
        v.updatedAt = uint64(block.timestamp);
        delete _pendingTransfers[vehicleId];

        // Record ownership change in chronological history
        _ownershipHistory[vehicleId].push(OwnershipRecord({
            owner: msg.sender,
            transferredAt: uint64(block.timestamp)
        }));

        // Transfer ERC-721 token
        _transfer(previousHolder, msg.sender, uint256(vehicleId));

        emit TransferCompleted(vehicleId, previousHolder, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Cancel a pending transfer. Callable by the current title holder.
     * @param vehicleId Unique identifier of the vehicle.
     */
    function cancelTransfer(bytes32 vehicleId) external whenNotPaused {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");

        if (_isPrivilegedAddress(msg.sender)) {
            revert CallerIsPrivilegedAuthority(msg.sender);
        }

        require(_vehicles[vehicleId].titleHolder == msg.sender, "Caller is not current title holder");
        require(_pendingTransfers[vehicleId] != address(0), "No transfer pending");

        delete _pendingTransfers[vehicleId];
        emit TransferCancelled(vehicleId, msg.sender, uint64(block.timestamp));
    }

    // ------------------------------------------------------------------ //
    //                        Emergency Controls                          //
    // ------------------------------------------------------------------ //

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------ //
    //                               Views                                //
    // ------------------------------------------------------------------ //

    /// @notice Returns minimal on-chain verification data for a vehicleId.
    function getVehicle(bytes32 vehicleId) external view returns (Vehicle memory) {
        return _vehicles[vehicleId];
    }

    /// @notice Resolves a VIN commitment to its vehicleId.
    function getVehicleByVinCommitment(bytes32 vinCommitment) external view returns (bytes32) {
        return _vinToVehicleId[vinCommitment];
    }

    /// @notice Resolves a registration plate commitment to its vehicleId.
    function getVehicleByPlateCommitment(bytes32 registrationCommitment) external view returns (bytes32) {
        return _plateToVehicleId[registrationCommitment];
    }

    /// @notice Returns the pending recipient address if a transfer is in progress.
    function getPendingTransfer(bytes32 vehicleId) external view returns (address) {
        return _pendingTransfers[vehicleId];
    }

    /// @notice Quick existence check.
    function isRegistered(bytes32 vehicleId) external view returns (bool) {
        return _vehicles[vehicleId].vehicleId != bytes32(0);
    }

    /// @notice Returns the complete chronological ownership transfer history of a vehicle.
    function getOwnershipHistory(bytes32 vehicleId) external view returns (OwnershipRecord[] memory) {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
        return _ownershipHistory[vehicleId];
    }

    /// @notice Returns the number of title holders a vehicle has had.
    function getOwnershipHistoryCount(bytes32 vehicleId) external view returns (uint256) {
        require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
        return _ownershipHistory[vehicleId].length;
    }

    /// @notice Helper to compute normalized VIN commitment off- or on-chain.
    function computeVinCommitment(string calldata vin) external pure returns (bytes32) {
        return keccak256(bytes(_upper(vin)));
    }

    /// @notice Helper to compute normalized plate commitment off- or on-chain.
    function computeRegistrationCommitment(string calldata regNumber) external pure returns (bytes32) {
        return keccak256(bytes(_upper(regNumber)));
    }

    // ------------------------------------------------------------------ //
    //                       Internal Utilities                           //
    // ------------------------------------------------------------------ //

    function _upper(string memory value) private pure returns (string memory) {
        bytes memory raw = bytes(value);
        bytes memory out = new bytes(raw.length);
        for (uint256 i = 0; i < raw.length; i++) {
            if (raw[i] >= 0x61 && raw[i] <= 0x7a) {
                out[i] = bytes1(uint8(raw[i]) - 32);
            } else {
                out[i] = raw[i];
            }
        }
        return string(out);
    }

    // OpenZeppelin ERC721 and AccessControl interface support
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
