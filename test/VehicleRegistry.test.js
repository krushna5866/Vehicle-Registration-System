const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VehicleRegistry - Confidentiality & Security Focused Architecture", function () {
  let registry;
  let admin;
  let rtoRegistrar;
  let rtoOfficer;
  let rto; // alias for rtoRegistrar
  let citizenOwner;
  let citizenBuyer;
  let unauthorizedUser;

  const SAMPLE_VIN = "MAT4453DMABC01234";
  const SAMPLE_PLATE = "MH 12 AB 1234";
  const DUMMY_METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ make: "Tata", model: "Nexon EV Max", year: 2024 })));
  const DUMMY_FIR_REASON_HASH = ethers.keccak256(ethers.toUtf8Bytes("CERT-SCRAP-447/2024"));

  let vinCommitment;
  let plateCommitment;

  beforeEach(async function () {
    [admin, rtoRegistrar, citizenOwner, citizenBuyer, rtoOfficer, unauthorizedUser] = await ethers.getSigners();
    rto = rtoRegistrar;

    const Factory = await ethers.getContractFactory("VehicleRegistry");
    registry = await Factory.deploy(admin.address, rtoRegistrar.address, rtoOfficer.address);
    await registry.waitForDeployment();

    vinCommitment = await registry.computeVinCommitment(SAMPLE_VIN);
    plateCommitment = await registry.computeRegistrationCommitment(SAMPLE_PLATE);
  });

  const registerDefaultCar = async (signer = rtoRegistrar, targetOwner = citizenOwner) => {
    const tx = await registry
      .connect(signer)
      .registerVehicle(vinCommitment, plateCommitment, targetOwner.address, DUMMY_METADATA_HASH);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "VehicleRegistered");
    return event.args.vehicleId;
  };

  describe("1. Role-Based Access Control (RBAC) & Clear RTO Role Boundaries", function () {
    it("assigns DEFAULT_ADMIN_ROLE, RTO_REGISTRAR_ROLE, and RTO_OFFICER_ROLE properly", async function () {
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      const officerRole = await registry.RTO_OFFICER_ROLE();

      expect(await registry.hasRole(adminRole, admin.address)).to.be.true;
      expect(await registry.hasRole(registrarRole, rtoRegistrar.address)).to.be.true;
      expect(await registry.hasRole(officerRole, rtoOfficer.address)).to.be.true;
      expect(await registry.hasRole(registrarRole, citizenOwner.address)).to.be.false;
      expect(await registry.hasRole(officerRole, citizenOwner.address)).to.be.false;
    });

    it("enforces clear boundary: RTO Officer cannot register new vehicles", async function () {
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      await expect(
        registry.connect(rtoOfficer).registerVehicle(vinCommitment, plateCommitment, citizenOwner.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(rtoOfficer.address, registrarRole);
    });

    it("enforces clear boundary: RTO Registrar cannot scrap/decommission vehicles", async function () {
      const vehicleId = await registerDefaultCar();
      const officerRole = await registry.RTO_OFFICER_ROLE();
      await expect(
        registry.connect(rtoRegistrar).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(rtoRegistrar.address, officerRole);
    });

    it("rejects vehicle registration from unauthorized citizen accounts", async function () {
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      await expect(
        registry
          .connect(citizenOwner)
          .registerVehicle(vinCommitment, plateCommitment, citizenOwner.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, registrarRole);
    });

    it("allows admin to grant and revoke RTO_REGISTRAR_ROLE", async function () {
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();

      await registry.connect(admin).grantRole(registrarRole, unauthorizedUser.address);
      expect(await registry.hasRole(registrarRole, unauthorizedUser.address)).to.be.true;

      await registry.connect(admin).revokeRole(registrarRole, unauthorizedUser.address);
      expect(await registry.hasRole(registrarRole, unauthorizedUser.address)).to.be.false;
    });
  });

  describe("2. Minimum On-Chain Data & Commitment Uniqueness", function () {
    it("stores only minimum required data and mints title NFT", async function () {
      const vehicleId = await registerDefaultCar();
      const v = await registry.getVehicle(vehicleId);

      expect(v.vehicleId).to.equal(vehicleId);
      expect(v.vinCommitment).to.equal(vinCommitment);
      expect(v.registrationCommitment).to.equal(plateCommitment);
      expect(v.titleHolder).to.equal(citizenOwner.address);
      expect(v.metadataHash).to.equal(DUMMY_METADATA_HASH);
      expect(v.state).to.equal(0n); // Active

      // Token title ownership
      expect(await registry.ownerOf(BigInt(vehicleId))).to.equal(citizenOwner.address);
    });

    it("rejects duplicate VIN commitments even with different letter cases", async function () {
      await registerDefaultCar();

      const sameVinDifferentCase = await registry.computeVinCommitment("mat4453dmabc01234");
      const newPlateCommitment = await registry.computeRegistrationCommitment("DL 01 AB 9999");

      await expect(
        registry.connect(rto).registerVehicle(
          sameVinDifferentCase,
          newPlateCommitment,
          citizenOwner.address,
          DUMMY_METADATA_HASH
        )
      ).to.be.revertedWith("VIN commitment already registered");
    });

    it("rejects duplicate registration plate commitments", async function () {
      await registerDefaultCar();

      const newVinCommitment = await registry.computeVinCommitment("MHFUF3E80K9999999");
      const samePlateDifferentCase = await registry.computeRegistrationCommitment("mh 12 ab 1234");

      await expect(
        registry.connect(rto).registerVehicle(
          newVinCommitment,
          samePlateDifferentCase,
          citizenOwner.address,
          DUMMY_METADATA_HASH
        )
      ).to.be.revertedWith("Plate commitment already registered");
    });

    it("resolves vehicleId by VIN commitment and Plate commitment", async function () {
      const vehicleId = await registerDefaultCar();

      expect(await registry.getVehicleByVinCommitment(vinCommitment)).to.equal(vehicleId);
      expect(await registry.getVehicleByPlateCommitment(plateCommitment)).to.equal(vehicleId);
    });
  });

  describe("3. Two-Step Safe Title Transfer Workflow", function () {
    it("allows owner to initiate and prospective buyer to accept transfer", async function () {
      const vehicleId = await registerDefaultCar();

      // Step 1: Owner initiates transfer
      await expect(registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address))
        .to.emit(registry, "TransferInitiated");

      expect(await registry.getPendingTransfer(vehicleId)).to.equal(citizenBuyer.address);

      // Step 2: Stranger cannot hijack the transfer
      await expect(
        registry.connect(unauthorizedUser).acceptTransfer(vehicleId)
      ).to.be.revertedWith("Caller is not the designated recipient");

      // Step 3: Designated buyer accepts the transfer
      await expect(registry.connect(citizenBuyer).acceptTransfer(vehicleId))
        .to.emit(registry, "TransferCompleted");

      const v = await registry.getVehicle(vehicleId);
      expect(v.titleHolder).to.equal(citizenBuyer.address);
      expect(await registry.getPendingTransfer(vehicleId)).to.equal(ethers.ZeroAddress);
      expect(await registry.ownerOf(BigInt(vehicleId))).to.equal(citizenBuyer.address);
    });

    it("allows current title holder to cancel a pending transfer", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address);
      expect(await registry.getPendingTransfer(vehicleId)).to.equal(citizenBuyer.address);

      await expect(registry.connect(citizenOwner).cancelTransfer(vehicleId))
        .to.emit(registry, "TransferCancelled");

      expect(await registry.getPendingTransfer(vehicleId)).to.equal(ethers.ZeroAddress);
    });

    it("rejects transfer to zero address and self-transfer", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, ethers.ZeroAddress)
      ).to.be.revertedWith("Recipient cannot be zero address");

      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenOwner.address)
      ).to.be.revertedWith("Recipient is already the title holder");
    });

    it("allows current title holder to directly transfer title", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(registry.connect(citizenOwner).transferTitle(vehicleId, citizenBuyer.address))
        .to.emit(registry, "TransferCompleted");

      const v = await registry.getVehicle(vehicleId);
      expect(v.titleHolder).to.equal(citizenBuyer.address);
      expect(await registry.ownerOf(BigInt(vehicleId))).to.equal(citizenBuyer.address);
    });

    it("allows RTO Registrar to officially transfer ownership on-chain via transferOwnershipByRTO", async function () {
      const vehicleId = await registerDefaultCar();
      const transferReasonHash = ethers.keccak256(ethers.toUtf8Bytes("RTO-TRANSFER-ORDER-2026-001"));

      // RTO Registrar transfers ownership to citizenBuyer
      await expect(
        registry.connect(rto).transferOwnershipByRTO(vehicleId, citizenBuyer.address, transferReasonHash)
      ).to.emit(registry, "TransferCompleted")
        .and.to.emit(registry, "OwnershipTransferredByRTO");

      const v = await registry.getVehicle(vehicleId);
      expect(v.titleHolder).to.equal(citizenBuyer.address);
      expect(await registry.ownerOf(BigInt(vehicleId))).to.equal(citizenBuyer.address);

      // Verify chronological history recorded
      const history = await registry.getOwnershipHistory(vehicleId);
      expect(history.length).to.equal(2);
      expect(history[1].owner).to.equal(citizenBuyer.address);
    });

    it("rejects RTO Officer and unauthorized citizen from calling transferOwnershipByRTO", async function () {
      const vehicleId = await registerDefaultCar();
      const transferReasonHash = ethers.keccak256(ethers.toUtf8Bytes("RTO-TRANSFER-ORDER-2026-002"));
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();

      // Officer cannot transfer ownership (Officer is restricted to Scrappage)
      await expect(
        registry.connect(rtoOfficer).transferOwnershipByRTO(vehicleId, citizenBuyer.address, transferReasonHash)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(rtoOfficer.address, registrarRole);

      // Citizen cannot transfer ownership via RTO function
      await expect(
        registry.connect(citizenOwner).transferOwnershipByRTO(vehicleId, citizenBuyer.address, transferReasonHash)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, registrarRole);
    });

    it("rejects transferOwnershipByRTO to an RTO authority address", async function () {
      const vehicleId = await registerDefaultCar();
      const transferReasonHash = ethers.keccak256(ethers.toUtf8Bytes("RTO-TRANSFER-ORDER-2026-003"));

      await expect(
        registry.connect(rto).transferOwnershipByRTO(vehicleId, rtoOfficer.address, transferReasonHash)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rtoOfficer.address);
    });
  });

  describe("4. Vehicle Scrappage & Terminal Decommissioning", function () {
    it("blocks transfer when vehicle is marked Scrapped", async function () {
      const vehicleId = await registerDefaultCar();

      // RTO Officer marks vehicle as Scrapped (state = 1)
      await registry.connect(rtoOfficer).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH);
      const v = await registry.getVehicle(vehicleId);
      expect(v.state).to.equal(1n);

      // Transfer attempt is blocked
      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address)
      ).to.be.revertedWith("Transfer locked: vehicle is not Active");
    });

    it("cancels pending transfers if marked Scrapped", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address);
      expect(await registry.getPendingTransfer(vehicleId)).to.equal(citizenBuyer.address);

      // RTO Officer marks scrapped
      await registry.connect(rtoOfficer).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH);
      expect(await registry.getPendingTransfer(vehicleId)).to.equal(ethers.ZeroAddress);
    });

    it("enforces Scrapped state as permanent terminal state", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(rtoOfficer).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH); // 1 = Scrapped
      expect((await registry.getVehicle(vehicleId)).state).to.equal(1n);

      // Attempting to move out of Scrapped state fails
      await expect(
        registry.connect(rtoOfficer).updateVehicleState(vehicleId, 0, DUMMY_FIR_REASON_HASH)
      ).to.be.revertedWith("Scrapped state is terminal");

      // Transfer is blocked
      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address)
      ).to.be.revertedWith("Transfer locked: vehicle is not Active");
    });
  });

  describe("5. Chronological Vehicle Ownership History Tracking", function () {
    it("records initial owner upon vehicle registration", async function () {
      const vehicleId = await registerDefaultCar();

      const history = await registry.getOwnershipHistory(vehicleId);
      expect(history.length).to.equal(1);
      expect(history[0].owner).to.equal(citizenOwner.address);
      expect(history[0].transferredAt).to.be.greaterThan(0);

      expect(await registry.getOwnershipHistoryCount(vehicleId)).to.equal(1);
    });

    it("appends new owner to history upon direct title transfer", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(citizenOwner).transferTitle(vehicleId, citizenBuyer.address);

      const history = await registry.getOwnershipHistory(vehicleId);
      expect(history.length).to.equal(2);
      expect(history[0].owner).to.equal(citizenOwner.address);
      expect(history[1].owner).to.equal(citizenBuyer.address);
      expect(await registry.getOwnershipHistoryCount(vehicleId)).to.equal(2);
    });

    it("appends new owner to history upon two-step title acceptance", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address);
      await registry.connect(citizenBuyer).acceptTransfer(vehicleId);

      const history = await registry.getOwnershipHistory(vehicleId);
      expect(history.length).to.equal(2);
      expect(history[0].owner).to.equal(citizenOwner.address);
      expect(history[1].owner).to.equal(citizenBuyer.address);

      // Transfer again to another user (Citizen 3)
      const allSigners = await ethers.getSigners();
      const thirdOwner = allSigners[6];
      await registry.connect(citizenBuyer).transferTitle(vehicleId, thirdOwner.address);

      const updatedHistory = await registry.getOwnershipHistory(vehicleId);
      expect(updatedHistory.length).to.equal(3);
      expect(updatedHistory[2].owner).to.equal(thirdOwner.address);
      expect(await registry.getOwnershipHistoryCount(vehicleId)).to.equal(3);
    });
  });

  describe("5. Emergency Pause Controls", function () {
    it("allows admin to pause and blocks sensitive state changes while paused", async function () {
      const vehicleId = await registerDefaultCar();

      await registry.connect(admin).pause();

      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await expect(
        registry.connect(rtoOfficer).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH)
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await registry.connect(admin).unpause();
      // Works again
      await expect(registry.connect(citizenOwner).initiateTransfer(vehicleId, citizenBuyer.address))
        .to.emit(registry, "TransferInitiated");
    });
  });

  describe("6. Event Privacy Verification", function () {
    it("emits events with technical commitments and hashes without plaintext PII", async function () {
      const tx = await registry.connect(rtoRegistrar).registerVehicle(
        vinCommitment,
        plateCommitment,
        citizenOwner.address,
        DUMMY_METADATA_HASH
      );
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log) => {
          try {
            return registry.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "VehicleRegistered");

      // Verify event args contain commitments and hashes only
      expect(event.args.vinCommitment).to.equal(vinCommitment);
      expect(event.args.registrationCommitment).to.equal(plateCommitment);
      expect(event.args.metadataHash).to.equal(DUMMY_METADATA_HASH);
      expect(event.args.titleHolder).to.equal(citizenOwner.address);
    });
  });

  describe("7. Strict Citizen–RTO Identity Separation & 16 Negative Security Invariants", function () {
    let officer;
    let freshCitizen;

    beforeEach(async function () {
      const signers = await ethers.getSigners();
      officer = signers[5];
      freshCitizen = signers[6];

      // Grant RTO_OFFICER_ROLE to officer
      const officerRole = await registry.RTO_OFFICER_ROLE();
      await registry.connect(admin).grantRole(officerRole, officer.address);
    });

    // Invariant 1: citizen cannot register vehicle
    it("1. citizen cannot register vehicle", async function () {
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      await expect(
        registry.connect(citizenOwner).registerVehicle(vinCommitment, plateCommitment, citizenOwner.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, registrarRole);
    });

    // Invariant 2: citizen cannot modify legal state
    it("2. citizen cannot modify legal state", async function () {
      const vehicleId = await registerDefaultCar();
      const officerRole = await registry.RTO_OFFICER_ROLE();
      await expect(
        registry.connect(citizenOwner).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, officerRole);
    });

    // Invariant 3: citizen cannot grant RTO role
    it("3. citizen cannot grant RTO role", async function () {
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      await expect(
        registry.connect(citizenOwner).grantRole(registrarRole, unauthorizedUser.address)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, adminRole);
    });

    // Invariant 4: citizen cannot perform RTO-only operation (pause / unpause)
    it("4. citizen cannot perform RTO-only administrative operations", async function () {
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      await expect(
        registry.connect(citizenOwner).pause()
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(citizenOwner.address, adminRole);
    });

    // Invariant 5: RTO wallet cannot own a vehicle
    it("5. RTO wallet cannot own a vehicle (reverts PrivilegedAddressCannotOwnVehicle)", async function () {
      const newVin = await registry.computeVinCommitment("MAT12345678901111");
      const newPlate = await registry.computeRegistrationCommitment("MH 14 CC 1111");

      // Attempt to register directly to RTO Registrar
      await expect(
        registry.connect(rto).registerVehicle(newVin, newPlate, rto.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rto.address);

      // Attempt to register to RTO Admin
      await expect(
        registry.connect(rto).registerVehicle(newVin, newPlate, admin.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(admin.address);

      // Attempt to register to RTO Officer
      await expect(
        registry.connect(rto).registerVehicle(newVin, newPlate, officer.address, DUMMY_METADATA_HASH)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(officer.address);
    });

    // Invariant 6: RTO wallet cannot receive vehicle transfer
    it("6. RTO wallet cannot receive vehicle transfer (initiateTransfer rejects privileged recipient)", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, rto.address)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rto.address);

      await expect(
        registry.connect(citizenOwner).initiateTransfer(vehicleId, officer.address)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(officer.address);
    });

    // Invariant 7: RTO wallet cannot invoke citizen-only ownership operation
    it("7. RTO wallet cannot invoke citizen-only ownership operations", async function () {
      const vehicleId = await registerDefaultCar();

      // RTO cannot call initiateTransfer
      await expect(
        registry.connect(rto).initiateTransfer(vehicleId, citizenBuyer.address)
      ).to.be.revertedWithCustomError(registry, "CallerIsPrivilegedAuthority")
        .withArgs(rto.address);

      // RTO cannot call transferTitle
      await expect(
        registry.connect(rto).transferTitle(vehicleId, citizenBuyer.address)
      ).to.be.revertedWithCustomError(registry, "CallerIsPrivilegedAuthority")
        .withArgs(rto.address);

      // RTO cannot call acceptTransfer (reverts because RTO cannot own vehicle)
      await expect(
        registry.connect(rto).acceptTransfer(vehicleId)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rto.address);

      // RTO cannot call cancelTransfer
      await expect(
        registry.connect(rto).cancelTransfer(vehicleId)
      ).to.be.revertedWithCustomError(registry, "CallerIsPrivilegedAuthority")
        .withArgs(rto.address);
    });

    // Invariant 8: privileged account cannot bypass frontend restrictions using direct contract calls
    it("8. privileged account cannot bypass frontend restrictions using direct contract calls", async function () {
      const vehicleId = await registerDefaultCar();

      // Officer directly calling transferTitle bypassing any UI guards
      await expect(
        registry.connect(officer).transferTitle(vehicleId, freshCitizen.address)
      ).to.be.revertedWithCustomError(registry, "CallerIsPrivilegedAuthority")
        .withArgs(officer.address);
    });

    // Invariant 9: assigning RTO role to an existing citizen owner is rejected
    it("9. assigning RTO role to an existing citizen owner is rejected", async function () {
      // citizenOwner owns a car
      await registerDefaultCar();
      expect(await registry.balanceOf(citizenOwner.address)).to.be.greaterThan(0);

      const officerRole = await registry.RTO_OFFICER_ROLE();
      const registrarRole = await registry.RTO_REGISTRAR_ROLE();
      const adminRole = await registry.RTO_ADMIN_ROLE();

      await expect(
        registry.connect(admin).grantRole(officerRole, citizenOwner.address)
      ).to.be.revertedWithCustomError(registry, "VehicleOwnerCannotReceivePrivilegedRole")
        .withArgs(citizenOwner.address);

      await expect(
        registry.connect(admin).grantRole(registrarRole, citizenOwner.address)
      ).to.be.revertedWithCustomError(registry, "VehicleOwnerCannotReceivePrivilegedRole")
        .withArgs(citizenOwner.address);

      await expect(
        registry.connect(admin).grantRole(adminRole, citizenOwner.address)
      ).to.be.revertedWithCustomError(registry, "VehicleOwnerCannotReceivePrivilegedRole")
        .withArgs(citizenOwner.address);
    });

    // Invariant 10: removing RTO role revokes authority
    it("10. removing RTO role revokes authority immediately", async function () {
      const vehicleId = await registerDefaultCar();
      const officerRole = await registry.RTO_OFFICER_ROLE();
      const tempOfficer = freshCitizen;

      // Grant RTO_OFFICER_ROLE
      await registry.connect(admin).grantRole(officerRole, tempOfficer.address);
      expect(await registry.hasRole(officerRole, tempOfficer.address)).to.be.true;

      // Temp officer can update state
      await expect(
        registry.connect(tempOfficer).updateVehicleState(vehicleId, 1, DUMMY_FIR_REASON_HASH)
      ).to.emit(registry, "VehicleStateChanged");

      // Revoke officer role
      await registry.connect(admin).revokeRole(officerRole, tempOfficer.address);
      expect(await registry.hasRole(officerRole, tempOfficer.address)).to.be.false;

      // Now call is immediately rejected
      await expect(
        registry.connect(tempOfficer).updateVehicleState(vehicleId, 0, DUMMY_FIR_REASON_HASH)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(tempOfficer.address, officerRole);
    });

    // Invariant 11: switching accounts invalidates stale session (identity isolation test)
    it("11. switching accounts invalidates stale session and detects identity mismatch", async function () {
      // Simulation of frontend session isolation check:
      // Active session: Citizen wallet
      const activeSession = { type: "CITIZEN", address: citizenOwner.address };

      // User switches MetaMask account to RTO Registrar
      const switchedAccount = rto.address;
      const isPrivileged = await registry.isPrivilegedAddress(switchedAccount);

      // Session verification rule
      const isStale = switchedAccount.toLowerCase() !== activeSession.address.toLowerCase();
      const isIllegalRole = activeSession.type === "CITIZEN" && isPrivileged;

      expect(isStale).to.be.true;
      expect(isIllegalRole).to.be.true;
      // Front-end state handler resets session:
      const invalidatedSession = (isStale || isIllegalRole) ? null : activeSession;
      expect(invalidatedSession).to.be.null;
    });

    // Invariant 12: citizen session cannot access RTO routes
    it("12. citizen session cannot access RTO routes", async function () {
      const isPrivileged = await registry.isPrivilegedAddress(citizenOwner.address);
      const vehicleCount = await registry.balanceOf(citizenOwner.address);

      // Target Portal: RTO
      // Guard condition: Must be privileged AND cannot own citizen vehicles
      const rtoRoutePermitted = isPrivileged && vehicleCount === 0n;
      expect(rtoRoutePermitted).to.be.false;
    });

    // Invariant 13: RTO session cannot access citizen routes
    it("13. RTO session cannot access citizen routes", async function () {
      const isPrivileged = await registry.isPrivilegedAddress(rto.address);

      // Target Portal: CITIZEN
      // Guard condition: Must NOT be a privileged authority
      const citizenRoutePermitted = !isPrivileged;
      expect(citizenRoutePermitted).to.be.false;
    });

    // Invariant 14: direct transfer path rejects privileged recipient
    it("14. direct transfer path rejects privileged recipient", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(
        registry.connect(citizenOwner).transferTitle(vehicleId, rto.address)
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rto.address);
    });

    // Invariant 15: safe transfer path rejects privileged recipient
    it("15. safe transfer path rejects privileged recipient (via ERC721 safeTransferFrom)", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(
        registry.connect(citizenOwner)["safeTransferFrom(address,address,uint256)"](
          citizenOwner.address,
          rto.address,
          BigInt(vehicleId)
        )
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(rto.address);
    });

    // Invariant 16: any other vehicle assignment/internal transfer path rejects privileged recipient
    it("16. internal transfer path rejects privileged recipient (via ERC721 transferFrom)", async function () {
      const vehicleId = await registerDefaultCar();

      await expect(
        registry.connect(citizenOwner).transferFrom(
          citizenOwner.address,
          officer.address,
          BigInt(vehicleId)
        )
      ).to.be.revertedWithCustomError(registry, "PrivilegedAddressCannotOwnVehicle")
        .withArgs(officer.address);
    });
  });
});
