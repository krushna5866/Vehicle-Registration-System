const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploys VehicleRegistry with strict separation of Citizen and RTO identities.
 * Authority accounts cannot own vehicles. Citizen accounts cannot hold RTO roles.
 */

const SEED_VEHICLES = [
  {
    vin: "MAT4453DMABC01234",
    regNumber: "MH 12 AB 1234",
    make: "Tata",
    model: "Nexon EV Max",
    year: 2024,
    ownerIndex: 2 // Citizen 1
  },
  {
    vin: "MBH22BH5678CD901",
    regNumber: "23 BH 4567 CD",
    make: "Mahindra",
    model: "XUV700 AX7 Pro",
    year: 2024,
    ownerIndex: 3 // Citizen 2
  },
  {
    vin: "MHFUF3E80K1234567",
    regNumber: "TN 10 KL 8899",
    make: "Toyota",
    model: "Fortuner Legender 4x4",
    year: 2023,
    ownerIndex: 2 // Citizen 1
  }
];

function normalize(str) {
  return str.trim().toUpperCase();
}

function computeCommitment(str) {
  return ethers.keccak256(ethers.toUtf8Bytes(normalize(str)));
}

async function main() {
  const signers = await ethers.getSigners();
  const [admin, rtoSigner, citizen1, citizen2, rtoOfficer] = signers;

  console.log("=".repeat(65));
  console.log(" Deploying VehicleRegistry (Strict Citizen vs Authority Separation)");
  console.log("=".repeat(65));
  console.log(" Institution Admin :", admin.address);
  console.log(" RTO Registrar     :", rtoSigner.address);
  console.log(" RTO Officer       :", rtoOfficer.address);
  console.log(" Citizen 1         :", citizen1.address);
  console.log(" Citizen 2         :", citizen2.address);

  const Registry = await ethers.getContractFactory("VehicleRegistry");
  const registry = await Registry.deploy(admin.address, rtoSigner.address, rtoOfficer.address);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("\n Contract deployed to:", address);
  console.log(" Digital Title Symbol   :", await registry.symbol());
  console.log(" RTO Registrar Account  :", rtoSigner.address);
  console.log(" RTO Officer Account    :", rtoOfficer.address);

  const offchainStore = {};

  console.log("\n Registering initial vehicles with cryptographic commitments (Citizens only)...");
  for (const [i, car] of SEED_VEHICLES.entries()) {
    const owner = signers[car.ownerIndex].address;
    const vinCommitment = computeCommitment(car.vin);
    const plateCommitment = computeCommitment(car.regNumber);

    const metadata = {
      make: car.make,
      model: car.model,
      year: car.year,
      plate: car.regNumber,
      registeredByRto: rtoSigner.address
    };
    const metadataString = JSON.stringify(metadata);
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));

    const tx = await registry
      .connect(rtoSigner)
      .registerVehicle(vinCommitment, plateCommitment, owner, metadataHash);
    const receipt = await tx.wait();

    // Parse VehicleRegistered event to get vehicleId
    const event = receipt.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "VehicleRegistered");

    const vehicleId = event.args.vehicleId;

    // Record off-chain metadata keyed by vehicleId and commitments
    offchainStore[vehicleId] = {
      vehicleId,
      vinCommitment,
      plateCommitment,
      metadataHash,
      make: car.make,
      model: car.model,
      year: car.year,
      plate: car.regNumber,
      vinMasked: `${car.vin.slice(0, 3)}...${car.vin.slice(-4)}`
    };

    console.log(
      `  #${i + 1} Registered ${car.regNumber.padEnd(14)} (${car.make} ${car.model}) -> Owner: ${owner.slice(0, 8)}... (gas: ${receipt.gasUsed})`
    );
  }

  console.log("\n Total vehicles on chain:", (await registry.totalVehicles()).toString());

  // Export contract ABI and address for frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/VehicleRegistry.sol/VehicleRegistry.json"
  );
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    abi = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;
  }

  const config = {
    address,
    network: "localhost",
    chainId: 31337,
    admin: admin.address,
    rtoRegistrar: rtoSigner.address,
    rtoOfficer: rtoOfficer.address,
    knownWallets: [
      {
        label: "Account #0 (Institution Admin)",
        address: admin.address,
        type: "AUTHORITY",
        role: "DEFAULT_ADMIN_ROLE",
        description: "Governance, System State & Emergency Controls"
      },
      {
        label: "Account #1 (RTO Registrar)",
        address: rtoSigner.address,
        type: "AUTHORITY",
        role: "RTO_REGISTRAR_ROLE",
        description: "Initial Vehicle Registration & Digital Title Issuance"
      },
      {
        label: "Account #4 (RTO Enforcement Officer)",
        address: rtoOfficer.address,
        type: "AUTHORITY",
        role: "RTO_OFFICER_ROLE",
        description: "Vehicle Inspection, Decommissioning & Scrappage"
      },
      {
        label: "Account #2 (Citizen 1 - Tata Owner)",
        address: citizen1.address,
        type: "CITIZEN",
        role: "CITIZEN_OWNER",
        description: "Citizen Title Holder (Owns Tata Nexon EV & Toyota Fortuner)"
      },
      {
        label: "Account #3 (Citizen 2 - Mahindra Owner)",
        address: citizen2.address,
        type: "CITIZEN",
        role: "CITIZEN_OWNER",
        description: "Citizen Title Holder (Owns Mahindra XUV700)"
      }
    ],
    abi
  };

  const configPath = path.join(__dirname, "../frontend/src/contractDetails.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(" Contract details exported to frontend/src/contractDetails.json");

  // Export off-chain metadata store
  const offchainPath = path.join(__dirname, "../frontend/src/offchainStorage.json");
  fs.writeFileSync(offchainPath, JSON.stringify(offchainStore, null, 2));
  console.log(" Off-chain metadata store exported to frontend/src/offchainStorage.json");
  console.log("=".repeat(65));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
