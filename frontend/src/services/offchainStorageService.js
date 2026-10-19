import { ethers } from "ethers";
import initialStore from "../offchainStorage.json";

const STORAGE_KEY = "vehicle_offchain_metadata_store";
const TRANSFER_WORKFLOW_KEY = "vehicle_rto_transfer_workflow_store";

function loadSavedMetadata() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage?.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadSavedWorkflows() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage?.getItem(TRANSFER_WORKFLOW_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// In-memory cache for off-chain technical specifications, initialized from initialStore and localStorage
const offchainCache = { ...(initialStore || {}), ...loadSavedMetadata() };
const workflowCache = { ...loadSavedWorkflows() };

/**
 * Normalizes input string to prevent duplicate/casing mismatches.
 */
export function normalizeIdentifier(val) {
  if (!val) return "";
  return val.trim().toUpperCase();
}

/**
 * Computes the keccak256 commitment of a normalized VIN.
 */
export function computeVinCommitment(vin) {
  const normalized = normalizeIdentifier(vin);
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

/**
 * Computes the keccak256 commitment of a normalized registration plate.
 */
export function computePlateCommitment(plate) {
  const normalized = normalizeIdentifier(plate);
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

/**
 * Computes metadataHash for off-chain specifications.
 */
export function computeMetadataHash(specs) {
  const canonicalString = JSON.stringify({
    make: specs.make?.trim() || "",
    model: specs.model?.trim() || "",
    year: Number(specs.year) || 0,
    plate: normalizeIdentifier(specs.plate || specs.regNumber || "")
  });
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalString));
}

/**
 * Stores off-chain metadata associated with a vehicleId and its metadataHash.
 * Persists to localStorage so newly registered vehicles are not lost across page refreshes.
 */
export function saveOffchainMetadata(vehicleId, specs) {
  const metadataHash = computeMetadataHash(specs);
  const vinMasked = specs.vin
    ? `${specs.vin.slice(0, 3)}...${specs.vin.slice(-4)}`
    : (specs.vinMasked || "VIN-PROTECTED");

  const entry = {
    vehicleId,
    metadataHash,
    make: specs.make?.trim() || "",
    model: specs.model?.trim() || "",
    year: Number(specs.year) || 0,
    plate: normalizeIdentifier(specs.plate || specs.regNumber || ""),
    vinMasked
  };

  offchainCache[vehicleId] = entry;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = loadSavedMetadata();
      saved[vehicleId] = entry;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  } catch (e) {
    console.warn("Could not persist offchain metadata to localStorage", e);
  }

  return entry;
}

/**
 * Retrieves off-chain vehicle specifications matching vehicleId.
 * Returns only technical specs (make, model, year, plate, masked VIN) without personal details.
 */
export function getOffchainMetadata(vehicleId) {
  return offchainCache[vehicleId] || null;
}

export function getAllOffchainMetadata() {
  return offchainCache;
}

/**
 * Saves or updates RTO ownership transfer & post-transfer process state for a vehicleId.
 */
export function saveTransferWorkflow(vehicleId, patch) {
  if (!vehicleId) return null;
  const current = workflowCache[vehicleId] || {};
  const updated = {
    ...current,
    ...patch,
    vehicleId,
    updatedAt: Math.floor(Date.now() / 1000)
  };
  workflowCache[vehicleId] = updated;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = loadSavedWorkflows();
      saved[vehicleId] = updated;
      window.localStorage.setItem(TRANSFER_WORKFLOW_KEY, JSON.stringify(saved));
    }
  } catch (e) {
    console.warn("Could not persist transfer workflow to localStorage", e);
  }

  return updated;
}

export function getTransferWorkflow(vehicleId) {
  if (!vehicleId) return null;
  return workflowCache[vehicleId] || loadSavedWorkflows()[vehicleId] || null;
}
