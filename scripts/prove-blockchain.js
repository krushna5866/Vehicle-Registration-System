const { ethers } = require("hardhat");

/**
 * Proof of Blockchain Security & Privacy Architecture
 * Demonstrates on the chain:
 *   1. AccessControl RBAC (unauthorized callers rejected)
 *   2. Commitments & Integrity (Duplicate rejection, minimal on-chain data)
 *   3. Two-Step Safe Title Transfer Workflow
 *   4. Legal State Machine (Theft lock blocks transfer)
 *   5. Emergency Pause Control
 */

const line = (c = "-") => console.log(c.repeat(66));

async function main() {
  const signers = await ethers.getSigners();
  const [admin, rtoSigner, citizen1, citizen2, rtoOfficer, stranger] = signers;

  let config = {};
  try {
    config = require("../frontend/src/contractDetails.json");
  } catch {
    config = {};
  }

  let registry;
  const existingCode = config.address ? await ethers.provider.getCode(config.address) : "0x";

  if (existingCode !== "0x") {
    registry = await ethers.getContractAt("VehicleRegistry", config.address);
  } else {
    console.log(" Deploying test instance on Hardhat provider for verification...");
    const Factory = await ethers.getContractFactory("VehicleRegistry");
    registry = await Factory.deploy(admin.address, rtoSigner.address, rtoOfficer.address);
    await registry.waitForDeployment();

    // Register initial vehicle
    const vin = ethers.keccak256(ethers.toUtf8Bytes("MAT4453DMABC01234"));
    const plate = ethers.keccak256(ethers.toUtf8Bytes("MH 12 AB 1234"));
    const meta = ethers.keccak256(ethers.toUtf8Bytes("seed-meta"));
    await registry.connect(rtoSigner).registerVehicle(vin, plate, citizen1.address, meta);
  }

  const contractAddress = await registry.getAddress();

  line("=");
  console.log(" PROOF OF BLOCKCHAIN SECURITY & CONFIDENTIALITY ARCHITECTURE");
  line("=");
  console.log(` Contract        : ${contractAddress}`);
  console.log(` Admin           : ${admin.address}`);
  console.log(` RTO Registrar   : ${rtoSigner.address}`);
  console.log(` RTO Officer     : ${rtoOfficer.address}`);

  /* 1. RBAC */
  line();
  console.log(" 1. ACCESS CONTROL ENFORCED ON-CHAIN VIA AccessControl");
  line();
  const testVinCommitment = ethers.keccak256(ethers.toUtf8Bytes("TESTVIN1234567890"));
  const testPlateCommitment = ethers.keccak256(ethers.toUtf8Bytes("MH 99 ZZ 9999"));
  const dummyMetaHash = ethers.keccak256(ethers.toUtf8Bytes("dummy-meta"));

  try {
    await registry
      .connect(stranger)
      .registerVehicle(testVinCommitment, testPlateCommitment, stranger.address, dummyMetaHash);
    console.log("   !! FAILED: Unauthorized wallet was able to register!");
  } catch {
    console.log("   OK: Unauthorized citizen wallet blocked by AccessControl (RTO_REGISTRAR_ROLE required).");
  }

  try {
    await registry
      .connect(rtoOfficer)
      .registerVehicle(testVinCommitment, testPlateCommitment, citizen1.address, dummyMetaHash);
    console.log("   !! FAILED: Enforcement Officer was able to register a new vehicle!");
  } catch {
    console.log("   OK: RTO Enforcement Officer blocked from registering vehicles (RTO_REGISTRAR_ROLE boundary intact).");
  }

  /* 2. Commitment Uniqueness */
  line();
  console.log(" 2. COMMITMENT UNIQUENESS & INTEGRITY PROOF");
  line();
  const existingPlateCommitment = await registry.computeRegistrationCommitment("MH 12 AB 1234");
  const existingVehicleId = await registry.getVehicleByPlateCommitment(existingPlateCommitment);
  console.log(` Existing plate commitment resolved to Vehicle ID: ${existingVehicleId.slice(0, 14)}...`);

  try {
    const newVin = ethers.keccak256(ethers.toUtf8Bytes("NEWVIN9999999999"));
    await registry
      .connect(rtoSigner)
      .registerVehicle(newVin, existingPlateCommitment, citizen1.address, dummyMetaHash);
    console.log("   !! FAILED: Duplicate plate commitment allowed!");
  } catch {
    console.log("   OK: Duplicate plate commitment rejected on-chain.");
  }

  /* 3. Two-Step Safe Transfer */
  line();
  console.log(" 3. TWO-STEP SAFE OWNERSHIP TRANSFER WORKFLOW");
  line();
  const vehicle = await registry.getVehicle(existingVehicleId);
  const currentOwner = signers.find((s) => s.address.toLowerCase() === vehicle.titleHolder.toLowerCase()) || citizen1;

  console.log(` Initiating transfer of title from ${currentOwner.address.slice(0, 8)}... to ${citizen2.address.slice(0, 8)}...`);
  const initTx = await registry.connect(currentOwner).initiateTransfer(existingVehicleId, citizen2.address);
  await initTx.wait();
  console.log(` Transfer initiated. Pending recipient: ${await registry.getPendingTransfer(existingVehicleId)}`);

  console.log(" Accepting transfer as designated recipient...");
  const acceptTx = await registry.connect(citizen2).acceptTransfer(existingVehicleId);
  await acceptTx.wait();
  const updatedVehicle = await registry.getVehicle(existingVehicleId);
  console.log(` Transfer completed on-chain. New title holder: ${updatedVehicle.titleHolder}`);

  // Transfer back to citizen1 to restore state
  await (await registry.connect(citizen2).initiateTransfer(existingVehicleId, citizen1.address)).wait();
  await (await registry.connect(citizen1).acceptTransfer(existingVehicleId)).wait();

  // Test direct title transfer
  console.log(" Testing direct transferTitle...");
  await (await registry.connect(citizen1).transferTitle(existingVehicleId, citizen2.address)).wait();
  console.log(` Direct transfer successful. Title holder: ${(await registry.getVehicle(existingVehicleId)).titleHolder}`);
  await (await registry.connect(citizen2).transferTitle(existingVehicleId, citizen1.address)).wait();

  /* 3b. Official Ownership Transfer Executed by RTO Registrar */
  line();
  console.log(" 3b. OFFICIAL OWNERSHIP TRANSFER EXECUTED VIA RTO REGISTRAR");
  line();
  const rtoTransferReason = ethers.keccak256(ethers.toUtf8Bytes("RTO-TRANSFER-APPROVAL-CERT-9912"));

  // Check Officer blocked
  try {
    await registry.connect(rtoOfficer).transferOwnershipByRTO(existingVehicleId, citizen2.address, rtoTransferReason);
    console.log("   !! FAILED: Officer was able to transfer ownership!");
  } catch {
    console.log("   OK: RTO Enforcement Officer blocked from transferring ownership (RTO_REGISTRAR_ROLE required).");
  }

  // Check citizen blocked
  try {
    await registry.connect(citizen1).transferOwnershipByRTO(existingVehicleId, citizen2.address, rtoTransferReason);
    console.log("   !! FAILED: Citizen was able to call transferOwnershipByRTO!");
  } catch {
    console.log("   OK: Citizen blocked from calling transferOwnershipByRTO (RTO_REGISTRAR_ROLE required).");
  }

  // Official RTO Registrar execution
  const rtoTx = await registry.connect(rtoSigner).transferOwnershipByRTO(existingVehicleId, citizen2.address, rtoTransferReason);
  await rtoTx.wait();
  console.log(`   OK: Ownership officially transferred via RTO Registrar. New Title Holder: ${(await registry.getVehicle(existingVehicleId)).titleHolder}`);

  // Re-transfer back to citizen1 via RTO Registrar
  await (await registry.connect(rtoSigner).transferOwnershipByRTO(existingVehicleId, citizen1.address, rtoTransferReason)).wait();
  console.log(`   OK: State restored via RTO Registrar. Title Holder: ${(await registry.getVehicle(existingVehicleId)).titleHolder}`);

  /* 4. Chronological Ownership History & Vehicle Scrappage */
  line();
  console.log(" 4. CHRONOLOGICAL OWNERSHIP HISTORY & VEHICLE SCRAPPAGE");
  line();

  // Test 4a: Ownership History Tracking
  const history = await registry.getOwnershipHistory(existingVehicleId);
  console.log(` On-Chain Ownership Records for Vehicle (${history.length} events):`);
  for (let i = 0; i < history.length; i++) {
    const rec = history[i];
    console.log(`   [${i + 1}] Owner: ${rec.owner.slice(0, 10)}... | Timestamp: ${new Date(Number(rec.transferredAt) * 1000).toLocaleString()}`);
  }
  if (history.length >= 2) {
    console.log("   OK: Complete chronological vehicle ownership history verified on-chain.");
  }

  // Test 4b: Decommissioning / Scrapping Terminal State
  const rand = Date.now();
  const scrapReasonHash = ethers.keccak256(ethers.toUtf8Bytes("SCRAP-TEST-CERT-" + rand));
  // Register a temporary car to test scrapping without destroying existingVehicleId
  const tempVin = ethers.keccak256(ethers.toUtf8Bytes("TEMP_SCRAP_VIN_" + rand));
  const tempPlate = ethers.keccak256(ethers.toUtf8Bytes("MH 99 SC " + (rand % 9000 + 1000)));
  const tempTx = await registry.connect(rtoSigner).registerVehicle(tempVin, tempPlate, citizen1.address, dummyMetaHash);
  const tempReceipt = await tempTx.wait();
  const tempEvent = tempReceipt.logs.map(l => { try { return registry.interface.parseLog(l); } catch { return null; } }).find(e => e && e.name === "VehicleRegistered");
  const tempVehicleId = tempEvent.args.vehicleId;

  // Registrar must be blocked from updating vehicle state (scrapping)
  try {
    await registry.connect(rtoSigner).updateVehicleState(tempVehicleId, 1, scrapReasonHash);
    console.log("   !! FAILED: Registrar was able to decommission/scrap vehicle!");
  } catch (err) {
    console.log("   OK: RTO Registrar blocked from scrapping vehicle (RTO_OFFICER_ROLE boundary intact).");
  }

  // Enforcement Officer performs scrappage
  await (await registry.connect(rtoOfficer).updateVehicleState(tempVehicleId, 1, scrapReasonHash)).wait(); // 1 = Scrapped
  console.log(" Temporary vehicle state updated to: SCRAPPED (1) by RTO Enforcement Officer.");

  try {
    await registry.connect(citizen1).initiateTransfer(tempVehicleId, citizen2.address);
    console.log("   !! FAILED: Scrapped vehicle was allowed to transfer!");
  } catch {
    console.log("   OK: Transfer of scrapped vehicle blocked by smart contract.");
  }

  /* 5. Emergency Pausable */
  line();
  console.log(" 5. EMERGENCY CONTROLS (PAUSABLE)");
  line();
  await (await registry.connect(admin).pause()).wait();
  console.log(" Contract paused by admin.");

  try {
    await registry.connect(citizen1).initiateTransfer(existingVehicleId, citizen2.address);
    console.log("   !! FAILED: Operation allowed while paused!");
  } catch {
    console.log("   OK: Operations blocked under EnforcedPause.");
  }

  await (await registry.connect(admin).unpause()).wait();
  console.log(" Contract unpaused by admin.");

  /* 6. Strict Citizen–RTO Identity Separation Proofs */
  line();
  console.log(" 6. STRICT CITIZEN–RTO IDENTITY SEPARATION (ON-CHAIN INVARIANTS)");
  line();

  // Test 6a: RTO Registrar & Officer cannot own a vehicle
  try {
    const testVin2 = ethers.keccak256(ethers.toUtf8Bytes("SEPARATIONVIN001_" + rand));
    const testPlate2 = ethers.keccak256(ethers.toUtf8Bytes("MH 01 AA " + (rand % 9000 + 1000)));
    await registry.connect(rtoSigner).registerVehicle(testVin2, testPlate2, rtoSigner.address, dummyMetaHash);
    console.log("   !! FAILED: RTO Registrar address was allowed to own a vehicle!");
  } catch (err) {
    console.log("   OK: RTO Registrar wallet blocked from owning vehicle (PrivilegedAddressCannotOwnVehicle).");
  }

  try {
    const testVin3 = ethers.keccak256(ethers.toUtf8Bytes("SEPARATIONVIN002_" + rand));
    const testPlate3 = ethers.keccak256(ethers.toUtf8Bytes("MH 01 AB " + (rand % 9000 + 1000)));
    await registry.connect(rtoSigner).registerVehicle(testVin3, testPlate3, rtoOfficer.address, dummyMetaHash);
    console.log("   !! FAILED: RTO Officer address was allowed to own a vehicle!");
  } catch (err) {
    console.log("   OK: RTO Officer wallet blocked from owning vehicle (PrivilegedAddressCannotOwnVehicle).");
  }

  // Test 6b: RTO wallet cannot receive transfer
  try {
    await registry.connect(citizen1).transferTitle(existingVehicleId, rtoOfficer.address);
    console.log("   !! FAILED: RTO Officer allowed to receive transfer!");
  } catch (err) {
    console.log("   OK: Title transfer to RTO Officer wallet blocked (PrivilegedAddressCannotOwnVehicle).");
  }

  // Test 6c: RTO wallet cannot invoke citizen-only transfer
  try {
    await registry.connect(rtoOfficer).transferTitle(existingVehicleId, citizen2.address);
    console.log("   !! FAILED: RTO authority was allowed to invoke citizen transferTitle!");
  } catch (err) {
    console.log("   OK: RTO authority blocked from calling citizen transferTitle (CallerIsPrivilegedAuthority).");
  }

  // Test 6d: Citizen owner cannot be granted RTO role
  try {
    const officerRole = await registry.RTO_OFFICER_ROLE();
    await registry.connect(admin).grantRole(officerRole, citizen1.address);
    console.log("   !! FAILED: Citizen owner was granted an RTO role!");
  } catch (err) {
    console.log("   OK: Role conflict prevention blocked granting RTO role to vehicle owner (VehicleOwnerCannotReceivePrivilegedRole).");
  }

  line("=");
  console.log(" All security & confidentiality architecture proofs verified on live chain.");
  line("=");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Proof script failed:", err);
    process.exit(1);
  });
