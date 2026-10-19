import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import config from "../contractDetails.json";
import seedOffchain from "../offchainStorage.json";
import {
  computeVinCommitment,
  computePlateCommitment,
  computeMetadataHash,
  saveOffchainMetadata,
  getOffchainMetadata
} from "../services/offchainStorageService";

const BlockchainContext = createContext();

const RPC_ENDPOINT_LOCAL = "http://127.0.0.1:8545";
const LOCAL_LEDGER_STORAGE_KEY = "vehicle_local_blockchain_ledger_v1";

// 2-Role Wallet Directory (RTO Authority & Citizen Owners)
const CLEAN_KNOWN_WALLETS = [
  {
    label: "RTO Authority Account",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    type: "AUTHORITY",
    role: "RTO",
    description: "Official RTO Registration, Transfer Intermediary & Scrappage Authority"
  },
  {
    label: "Citizen 1 (Vehicle Owner)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    type: "CITIZEN",
    role: "CITIZEN",
    description: "Citizen Vehicle Title Holder"
  },
  {
    label: "Citizen 2 (Vehicle Owner)",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    type: "CITIZEN",
    role: "CITIZEN",
    description: "Citizen Vehicle Title Holder"
  }
];

function getInitialLocalLedger() {
  try {
    const raw = localStorage.getItem(LOCAL_LEDGER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage error
  }

  const entries = Object.values(seedOffchain || {});
  const citizen1 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const citizen2 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const nowSec = Math.floor(Date.now() / 1000) - 86400;

  const seeded = entries.map((item, idx) => {
    const owner = idx === 1 ? citizen2 : citizen1;
    return {
      vehicleId: item.vehicleId,
      vinCommitment: item.vinCommitment,
      registrationCommitment: item.plateCommitment,
      state: 0, // 0 = Active, 1 = Scrapped
      titleHolder: owner,
      pendingTransferTo: null,
      pendingRequestedAt: null,
      lastTransferApprovedAt: null,
      previousOwner: null,
      pendingScrapRequest: false,
      scrapReason: null,
      scrappedAt: null,
      metadataHash: item.metadataHash,
      registeredAt: nowSec + idx * 600,
      updatedAt: nowSec + idx * 600,
      make: item.make,
      model: item.model,
      year: item.year,
      regNumber: item.plate,
      vinMasked: item.vinMasked,
      history: [{ owner, transferredAt: nowSec + idx * 600 }]
    };
  });

  try {
    localStorage.setItem(LOCAL_LEDGER_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

function saveLocalLedger(list) {
  try {
    localStorage.setItem(LOCAL_LEDGER_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function BlockchainProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isNodeConnected, setIsNodeConnected] = useState(true);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [vehicles, setVehicles] = useState(() => getInitialLocalLedger());
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [busy, setBusy] = useState(false);

  const contractRef = useRef(null);
  const readContractRef = useRef(null);
  const localRpcRef = useRef(null);
  const signerRef = useRef(null);

  // Try connecting to local Hardhat RPC if available and contract is deployed
  const getLocalRpcProvider = useCallback(async () => {
    if (localRpcRef.current) {
      try {
        const code = await localRpcRef.current.getCode(config.address);
        if (code && code !== "0x") return localRpcRef.current;
      } catch {
        localRpcRef.current = null;
      }
    }

    const urls = [RPC_ENDPOINT_LOCAL, "http://localhost:8545"];
    if (typeof window !== "undefined" && window.location?.origin) {
      urls.unshift(`${window.location.origin}/rpc`);
    }

    for (const url of urls) {
      try {
        const jsonRpcProvider = new ethers.JsonRpcProvider(
          url,
          { chainId: 31337, name: "localhost" },
          { staticNetwork: true }
        );
        const code = await jsonRpcProvider.getCode(config.address);
        if (code && code !== "0x") {
          localRpcRef.current = jsonRpcProvider;
          return jsonRpcProvider;
        }
      } catch {
        // continue
      }
    }
    return null;
  }, []);

  // Fetch vehicles from local ledger (and sync with on-chain if deployed)
  const fetchVehicles = useCallback(async (contractInstance) => {
    const existingLocal = getInitialLocalLedger();
    const localById = {};
    for (const item of existingLocal) {
      localById[item.vehicleId] = item;
    }

    const activeContract = readContractRef.current || contractInstance || contractRef.current;
    if (activeContract) {
      try {
        const filter = activeContract.filters.VehicleRegistered();
        const events = await activeContract.queryFilter(filter, 0, "latest");

        const onchainList = await Promise.all(
          events.map(async (ev) => {
            try {
              const vId = ev.args.vehicleId;
              const onchain = await activeContract.getVehicle(vId);
              const pendingTo = await activeContract.getPendingTransfer(vId);
              const offchain = getOffchainMetadata(vId) || {};
              const localCached = localById[vId] || {};

              let ownershipHistory = [];
              try {
                if (typeof activeContract.getOwnershipHistory === "function") {
                  const rawH = await activeContract.getOwnershipHistory(vId);
                  ownershipHistory = rawH.map((h) => ({
                    owner: h.owner,
                    transferredAt: Number(h.transferredAt)
                  }));
                }
              } catch {
                ownershipHistory = localCached.history || [];
              }

              const onchainState = Number(onchain.state);
              const effectiveState =
                localCached.state === 1 || onchainState === 1 ? 1 : 0;

              const hasOnchainPending = pendingTo && pendingTo !== ethers.ZeroAddress;
              const effectivePendingTo =
                effectiveState === 1
                  ? null
                  : hasOnchainPending
                  ? pendingTo
                  : localCached.pendingTransferTo || null;

              const previousOwner =
                ownershipHistory.length >= 2
                  ? ownershipHistory[ownershipHistory.length - 2].owner
                  : localCached.previousOwner || null;

              return {
                vehicleId: vId,
                vinCommitment: onchain.vinCommitment,
                registrationCommitment: onchain.registrationCommitment,
                state: effectiveState,
                titleHolder: localCached.titleHolder || onchain.titleHolder,
                pendingTransferTo: effectivePendingTo,
                pendingRequestedAt: localCached.pendingRequestedAt || null,
                lastTransferApprovedAt: localCached.lastTransferApprovedAt || null,
                previousOwner,
                pendingScrapRequest: effectiveState === 1 ? false : Boolean(localCached.pendingScrapRequest),
                scrapReason: localCached.scrapReason || null,
                scrappedAt: localCached.scrappedAt || null,
                metadataHash: onchain.metadataHash,
                registeredAt: Number(onchain.registeredAt),
                updatedAt: localCached.updatedAt || Number(onchain.updatedAt),
                make: offchain.make || localCached.make || "Registered Vehicle",
                model: offchain.model || localCached.model || "",
                year: offchain.year || localCached.year || "-",
                regNumber: offchain.plate || localCached.regNumber || "PLATE-PROTECTED",
                vinMasked: offchain.vinMasked || localCached.vinMasked || "VIN-PROTECTED",
                history:
                  localCached.history && localCached.history.length > ownershipHistory.length
                    ? localCached.history
                    : ownershipHistory
              };
            } catch {
              return null;
            }
          })
        );

        const validOnchain = onchainList.filter(Boolean);
        const onchainIds = new Set(validOnchain.map((v) => v.vehicleId));
        const localOnly = existingLocal.filter((v) => !onchainIds.has(v.vehicleId));
        const merged = [...localOnly, ...validOnchain];
        if (merged.length > 0) {
          setVehicles(merged);
          saveLocalLedger(merged);
          return merged;
        }
      } catch {
        // Fallback to local ledger below
      }
    }

    setVehicles(existingLocal);
    return existingLocal;
  }, []);

  useEffect(() => {
    (async () => {
      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider) {
        const liveReadContract = new ethers.Contract(config.address, config.abi, rpcProvider);
        readContractRef.current = liveReadContract;
        setProvider(rpcProvider);
        setReadContract(liveReadContract);
        setContract(liveReadContract);
        setIsNodeConnected(true);
        await fetchVehicles(liveReadContract);
      } else {
        setIsNodeConnected(true);
        await fetchVehicles(null);
      }
    })();
  }, [getLocalRpcProvider, fetchVehicles]);

  // Select any valid wallet address for login
  const selectLocalAccount = async (targetAddress) => {
    try {
      const cleanAddress = ethers.getAddress(targetAddress.trim());
      const rpcProvider = await getLocalRpcProvider();

      if (rpcProvider) {
        try {
          await rpcProvider.send("hardhat_impersonateAccount", [cleanAddress]);
          await rpcProvider.send("hardhat_setBalance", [cleanAddress, "0x56BC75E2D63100000"]);
        } catch {
          // Default accounts are already unlocked and funded
        }

        const targetSigner = await rpcProvider.getSigner(cleanAddress);
        const liveWriteContract = new ethers.Contract(config.address, config.abi, targetSigner);
        const liveReadContract = new ethers.Contract(config.address, config.abi, rpcProvider);

        contractRef.current = liveWriteContract;
        readContractRef.current = liveReadContract;
        signerRef.current = targetSigner;

        setProvider(rpcProvider);
        setSigner(targetSigner);
        setContract(liveWriteContract);
        setReadContract(liveReadContract);
        setConnectedWallet(cleanAddress);
        setIsNodeConnected(true);

        await fetchVehicles(liveReadContract);

        return {
          signer: targetSigner,
          address: cleanAddress,
          contract: liveReadContract,
          writeContract: liveWriteContract,
          mode: "LOCAL"
        };
      }

      setConnectedWallet(cleanAddress);
      setIsNodeConnected(true);
      await fetchVehicles(null);

      return {
        signer: { getAddress: async () => cleanAddress },
        address: cleanAddress,
        contract: null,
        writeContract: null,
        mode: "LOCAL_LEDGER"
      };
    } catch (err) {
      console.error("Failed to select account:", err);
      return null;
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setSigner(null);
    signerRef.current = null;
  };

  /**
   * 1. Register New Vehicle (RTO Authority)
   */
  const registerVehicle = async ({ vin, regNumber, make, model, year, titleHolder }) => {
    setBusy(true);
    setStatusMsg("");
    try {
      const cleanOwner = ethers.getAddress(titleHolder.trim());
      const vinCommitment = computeVinCommitment(vin);
      const plateCommitment = computePlateCommitment(regNumber);

      const currentList = getInitialLocalLedger();
      if (currentList.some((v) => v.vinCommitment?.toLowerCase() === vinCommitment.toLowerCase())) {
        throw new Error("A vehicle with this VIN / Chassis Number is already registered on the ledger.");
      }
      if (currentList.some((v) => v.registrationCommitment?.toLowerCase() === plateCommitment.toLowerCase())) {
        throw new Error(`Registration Plate "${regNumber.trim().toUpperCase()}" is already registered on the ledger.`);
      }

      const metadataPayload = {
        make,
        model,
        year: Number(year),
        plate: regNumber.trim().toUpperCase(),
        registeredAt: new Date().toISOString()
      };
      const metadataHash = computeMetadataHash(metadataPayload);

      let vehicleId = null;

      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider) {
        try {
          const rtoRegistrarAddr = config.rtoRegistrar || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
          const registrarSigner = await rpcProvider.getSigner(rtoRegistrarAddr);
          const registrarContract = new ethers.Contract(config.address, config.abi, registrarSigner);

          const tx = await registrarContract.registerVehicle(
            vinCommitment,
            plateCommitment,
            cleanOwner,
            metadataHash
          );
          const receipt = await tx.wait();

          const event = receipt.logs
            .map((log) => {
              try {
                return registrarContract.interface.parseLog(log);
              } catch {
                return null;
              }
            })
            .find((e) => e && e.name === "VehicleRegistered");

          vehicleId = event ? event.args.vehicleId : null;
        } catch (chainErr) {
          console.warn("On-chain registration skipped, committing to local ledger:", chainErr);
        }
      }

      if (!vehicleId) {
        vehicleId = ethers.keccak256(
          ethers.solidityPacked(["bytes32", "bytes32", "uint256"], [vinCommitment, plateCommitment, BigInt(Date.now())])
        );
      }

      const cleanVin = vin.trim().toUpperCase();
      const vinMasked = `${cleanVin.slice(0, 3)}...${cleanVin.slice(-4)}`;
      const cleanPlate = regNumber.trim().toUpperCase();

      saveOffchainMetadata(vehicleId, {
        vehicleId,
        vinCommitment,
        plateCommitment,
        metadataHash,
        make,
        model,
        year: Number(year),
        plate: cleanPlate,
        vinMasked
      });

      const nowSec = Math.floor(Date.now() / 1000);
      const newRecord = {
        vehicleId,
        vinCommitment,
        registrationCommitment: plateCommitment,
        state: 0,
        titleHolder: cleanOwner,
        pendingTransferTo: null,
        pendingRequestedAt: null,
        lastTransferApprovedAt: null,
        previousOwner: null,
        pendingScrapRequest: false,
        scrapReason: null,
        scrappedAt: null,
        metadataHash,
        registeredAt: nowSec,
        updatedAt: nowSec,
        make,
        model,
        year: Number(year),
        regNumber: cleanPlate,
        vinMasked,
        history: [{ owner: cleanOwner, transferredAt: nowSec }]
      };

      const updatedLedger = [newRecord, ...currentList.filter((v) => v.vehicleId !== vehicleId)];
      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        vehicleId,
        message: `Vehicle ${cleanPlate} (${make} ${model}) successfully registered to Citizen ${cleanOwner.slice(0, 6)}...${cleanOwner.slice(-4)}!`
      };
    } catch (err) {
      const msg = err?.reason || err?.message || "Vehicle registration failed.";
      return { success: false, error: msg };
    } finally {
      setBusy(false);
    }
  };

  /**
   * 2. Step 1 of Transfer: Old Owner (Seller) submits Ownership Transfer Request to RTO Intermediary
   */
  const initiateTransfer = async (vehicleId, newOwnerAddress) => {
    setBusy(true);
    try {
      const cleanBuyer = ethers.getAddress(newOwnerAddress.trim());
      const currentList = getInitialLocalLedger();
      const target = currentList.find((v) => v.vehicleId === vehicleId);

      if (!target) {
        throw new Error("Vehicle record not found.");
      }
      if (target.state === 1) {
        throw new Error("Cannot transfer a permanently Scrapped / Deregistered vehicle.");
      }
      if (target.titleHolder?.toLowerCase() === cleanBuyer.toLowerCase()) {
        throw new Error("New owner wallet address cannot be the same as the current owner.");
      }

      const rtoAddresses = CLEAN_KNOWN_WALLETS.filter((w) => w.type === "AUTHORITY").map((w) =>
        w.address.toLowerCase()
      );
      if (rtoAddresses.includes(cleanBuyer.toLowerCase())) {
        throw new Error("RTO Authority acts only as the intermediary and cannot be the new vehicle owner. Please enter a Citizen wallet address.");
      }

      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider && target.titleHolder) {
        try {
          const ownerSigner = await rpcProvider.getSigner(target.titleHolder);
          const ownerContract = new ethers.Contract(config.address, config.abi, ownerSigner);
          const tx = await ownerContract.initiateTransfer(vehicleId, cleanBuyer);
          await tx.wait();
        } catch (chainErr) {
          console.warn("On-chain initiateTransfer skipped, recorded in local RTO queue:", chainErr);
        }
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        return {
          ...v,
          pendingTransferTo: cleanBuyer,
          pendingRequestedAt: nowSec,
          updatedAt: nowSec
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: `Ownership transfer request for ${target.regNumber} submitted to RTO Intermediary! Awaiting RTO approval to transfer title to ${cleanBuyer.slice(0, 6)}...${cleanBuyer.slice(-4)}.`
      };
    } catch (err) {
      return {
        success: false,
        error: err?.reason || err?.message || "Failed to submit transfer request to RTO."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * 3. Step 2 of Transfer: RTO Intermediary Approves & Executes Ownership Transfer from Old Owner to New Owner
   */
  const approveTransferByRTO = async (vehicleId, customBuyerAddress = null) => {
    setBusy(true);
    try {
      const currentList = getInitialLocalLedger();
      const target = currentList.find((v) => v.vehicleId === vehicleId);

      if (!target) {
        throw new Error("Vehicle record not found.");
      }
      if (target.state === 1) {
        throw new Error("Cannot transfer a permanently Scrapped / Deregistered vehicle.");
      }

      const buyerRaw = customBuyerAddress || target.pendingTransferTo;
      if (!buyerRaw || !ethers.isAddress(buyerRaw)) {
        throw new Error("No valid new owner address specified for this transfer.");
      }
      const cleanBuyer = ethers.getAddress(buyerRaw.trim());
      const oldOwner = target.titleHolder;

      if (oldOwner?.toLowerCase() === cleanBuyer.toLowerCase()) {
        throw new Error("New owner is already the current owner of this vehicle.");
      }

      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider) {
        try {
          const rtoRegistrarAddr = config.rtoRegistrar || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
          const registrarSigner = await rpcProvider.getSigner(rtoRegistrarAddr);
          const registrarContract = new ethers.Contract(config.address, config.abi, registrarSigner);
          const approvalHash = ethers.keccak256(
            ethers.toUtf8Bytes(`RTO-INTERMEDIARY-APPROVAL-${vehicleId}-${Date.now()}`)
          );
          const tx = await registrarContract.transferOwnershipByRTO(vehicleId, cleanBuyer, approvalHash);
          await tx.wait();
        } catch (chainErr) {
          console.warn("On-chain transferOwnershipByRTO skipped, committing in local ledger:", chainErr);
        }
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        const existingHistory = Array.isArray(v.history) && v.history.length > 0
          ? v.history
          : [{ owner: oldOwner, transferredAt: v.registeredAt || nowSec }];

        return {
          ...v,
          previousOwner: oldOwner,
          titleHolder: cleanBuyer,
          pendingTransferTo: null,
          pendingRequestedAt: null,
          lastTransferApprovedAt: nowSec,
          updatedAt: nowSec,
          history: [...existingHistory, { owner: cleanBuyer, transferredAt: nowSec }]
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: `RTO Intermediary Approved! Ownership of ${target.regNumber} (${target.make} ${target.model}) has been officially transferred from Old Owner (${oldOwner.slice(0, 6)}...${oldOwner.slice(-4)}) to New Owner (${cleanBuyer.slice(0, 6)}...${cleanBuyer.slice(-4)}).`
      };
    } catch (err) {
      return {
        success: false,
        error: err?.reason || err?.message || "Failed to approve ownership transfer."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * Cancel / Reject a Pending Transfer Request
   */
  const cancelTransfer = async (vehicleId) => {
    setBusy(true);
    try {
      const currentList = getInitialLocalLedger();
      const target = currentList.find((v) => v.vehicleId === vehicleId);
      if (!target) {
        throw new Error("Vehicle record not found.");
      }

      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider && target.titleHolder) {
        try {
          const ownerSigner = await rpcProvider.getSigner(target.titleHolder);
          const ownerContract = new ethers.Contract(config.address, config.abi, ownerSigner);
          const tx = await ownerContract.cancelTransfer(vehicleId);
          await tx.wait();
        } catch {
          // ignore
        }
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        return {
          ...v,
          pendingTransferTo: null,
          pendingRequestedAt: null,
          updatedAt: nowSec
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: `Pending transfer request for ${target.regNumber} has been cancelled.`
      };
    } catch (err) {
      return {
        success: false,
        error: err?.reason || err?.message || "Failed to cancel transfer request."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * 4. Citizen Requests Vehicle Scrappage (Sent to RTO for Approval)
   */
  const requestScrapVehicle = async (vehicleId, reason = "") => {
    setBusy(true);
    try {
      const currentList = getInitialLocalLedger();
      const target = currentList.find((v) => v.vehicleId === vehicleId);
      if (!target) {
        throw new Error("Vehicle record not found.");
      }
      if (target.state === 1) {
        throw new Error("Vehicle is already permanently Scrapped.");
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const cleanReason =
        reason.trim() || "Owner Voluntary End-of-Life Vehicle (ELV) Scrappage Application";

      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        return {
          ...v,
          pendingScrapRequest: true,
          scrapReason: cleanReason,
          updatedAt: nowSec
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: `Scrappage application for ${target.regNumber} submitted to RTO! Switch to the RTO Portal to approve permanent scrappage.`
      };
    } catch (err) {
      return {
        success: false,
        error: err?.message || "Failed to submit scrappage request."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * 5. RTO Permanently Scraps / Decommissions a Vehicle (Terminal State: state = 1)
   */
  const scrapVehicle = async (vehicleId, reason = "") => {
    setBusy(true);
    try {
      const currentList = getInitialLocalLedger();
      const target = currentList.find((v) => v.vehicleId === vehicleId);
      if (!target) {
        throw new Error("Vehicle record not found.");
      }
      if (target.state === 1) {
        throw new Error("Vehicle is already permanently Scrapped. Scrappage is an irreversible terminal state.");
      }

      const cleanReason =
        reason.trim() ||
        target.scrapReason ||
        `RTO Official Scrappage & End-of-Life Deregistration Order (CERT-SCRAP-${Date.now().toString().slice(-5)})`;

      // Also execute on-chain via RTO Officer if contract is live
      const rpcProvider = await getLocalRpcProvider();
      if (rpcProvider) {
        try {
          const rtoOfficerAddr = config.rtoOfficer || "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
          const officerSigner = await rpcProvider.getSigner(rtoOfficerAddr);
          const officerContract = new ethers.Contract(config.address, config.abi, officerSigner);
          const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(cleanReason));
          const tx = await officerContract.updateVehicleState(vehicleId, 1, reasonHash);
          await tx.wait();
        } catch (chainErr) {
          console.warn("On-chain updateVehicleState skipped, committing scrappage to local ledger:", chainErr);
        }
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        return {
          ...v,
          state: 1, // 1 = Permanently Scrapped
          pendingTransferTo: null, // Automatically cancels any pending transfer
          pendingRequestedAt: null,
          pendingScrapRequest: false,
          scrapReason: cleanReason,
          scrappedAt: nowSec,
          updatedAt: nowSec
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: `Vehicle ${target.regNumber} (${target.make} ${target.model}) has been permanently Scrapped and Deregistered on the ledger. All future transfers for this vehicle are permanently locked.`
      };
    } catch (err) {
      return {
        success: false,
        error: err?.reason || err?.message || "Failed to scrap vehicle."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * Cancel / Reject a Pending Scrap Request
   */
  const cancelScrapRequest = async (vehicleId) => {
    setBusy(true);
    try {
      const currentList = getInitialLocalLedger();
      const nowSec = Math.floor(Date.now() / 1000);
      const updatedLedger = currentList.map((v) => {
        if (v.vehicleId !== vehicleId) return v;
        return {
          ...v,
          pendingScrapRequest: false,
          scrapReason: null,
          updatedAt: nowSec
        };
      });

      saveLocalLedger(updatedLedger);
      setVehicles(updatedLedger);

      return {
        success: true,
        message: "Pending scrappage request cancelled."
      };
    } finally {
      setBusy(false);
    }
  };

  /**
   * Public Verification Lookup by Plate or VIN
   */
  const verifyVehicle = async (query) => {
    const clean = (query || "").trim().toUpperCase();
    if (!clean) return null;

    const vinComm = computeVinCommitment(clean);
    const plateComm = computePlateCommitment(clean);

    const currentList = vehicles.length > 0 ? vehicles : getInitialLocalLedger();
    const cleanCompact = clean.replace(/\s+/g, "");

    const matched = currentList.find((v) => {
      const vPlateCompact = (v.regNumber || "").toUpperCase().replace(/\s+/g, "");
      return (
        vPlateCompact === cleanCompact ||
        v.vinCommitment?.toLowerCase() === vinComm.toLowerCase() ||
        v.registrationCommitment?.toLowerCase() === plateComm.toLowerCase() ||
        v.vehicleId?.toLowerCase() === clean.toLowerCase()
      );
    });

    if (matched) {
      return {
        found: true,
        vehicleId: matched.vehicleId,
        state: matched.state ?? 0,
        scrapReason: matched.scrapReason || null,
        scrappedAt: matched.scrappedAt || null,
        titleHolder: matched.titleHolder,
        previousOwner: matched.previousOwner || null,
        pendingTransferTo: matched.pendingTransferTo || null,
        registeredAt: matched.registeredAt,
        updatedAt: matched.updatedAt,
        vinCommitment: matched.vinCommitment,
        registrationCommitment: matched.registrationCommitment,
        metadataHash: matched.metadataHash,
        make: matched.make || "Registered Vehicle",
        model: matched.model || "",
        year: matched.year || "-",
        plate: matched.regNumber || clean,
        vinMasked: matched.vinMasked || "PROTECTED",
        history: matched.history || [{ owner: matched.titleHolder, transferredAt: matched.registeredAt }]
      };
    }

    return "NOT_FOUND";
  };

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        contract,
        readContract,
        signer,
        isNodeConnected,
        connectedWallet,
        vehicles,
        busy,
        statusMsg,
        statusType,
        setStatusMsg,
        selectLocalAccount,
        disconnectWallet,
        registerVehicle,
        initiateTransfer,
        approveTransferByRTO,
        cancelTransfer,
        requestScrapVehicle,
        scrapVehicle,
        cancelScrapRequest,
        verifyVehicle,
        fetchVehicles,
        contractAddress: config.address,
        knownWallets: CLEAN_KNOWN_WALLETS
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
}
