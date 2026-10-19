import React, { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  FilePlus,
  ArrowLeftRight,
  Trash2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  RefreshCw,
  UserCheck,
  Hash,
  AlertTriangle,
  X,
  FileText,
  User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBlockchain } from "../context/BlockchainContext";
import HSRPPlate from "../components/HSRPPlate";
import WalletModal from "../components/WalletModal";
import DigitalRcModal from "../components/DigitalRcModal";
import {
  STATE_SERIES,
  POPULAR_CAR_PRESETS,
  maskAddress,
  maskIdentifier
} from "../constants/vehicleConstants";

function generateIndianVin(prefix = "MAT") {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 14; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`.slice(0, 17);
}

const SCRAP_REASONS = [
  "End-of-Life Vehicle (ELV > 15 Years)",
  "Total Loss / Severe Accident Damage",
  "Voluntary Owner Scrappage Certificate (RVSF)",
  "Chassis / Structural Condemnation"
];

export default function RtoPortalPage() {
  const { authenticatedAddress, authenticateAsAddress, logout } = useAuth();
  const {
    vehicles,
    registerVehicle,
    approveTransferByRTO,
    cancelTransfer,
    scrapVehicle,
    cancelScrapRequest,
    selectLocalAccount,
    readContract,
    busy,
    knownWallets
  } = useBlockchain();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "register"); // 'register' | 'transfer' | 'scrap' | 'ledger'
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const citizenWallets = useMemo(() => {
    const list = (knownWallets || []).filter((w) => w.type === "CITIZEN");
    return list.length > 0
      ? list
      : [
          { label: "Citizen 1", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", type: "CITIZEN" },
          { label: "Citizen 2", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", type: "CITIZEN" }
        ];
  }, [knownWallets]);

  const defaultCitizen = citizenWallets[0]?.address || "";

  // Form 20 Registration Form State
  const [regForm, setRegForm] = useState({
    vin: generateIndianVin("MAT"),
    regNumber:
      "MH 12 " +
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      " " +
      Math.floor(1000 + Math.random() * 9000),
    make: "Tata",
    model: "Nexon EV Max",
    year: "2024",
    titleHolder: defaultCitizen
  });

  // Direct RTO Desk Transfer Form State
  const [directTransferVehicleId, setDirectTransferVehicleId] = useState("");
  const [directNewOwnerWallet, setDirectNewOwnerWallet] = useState("");

  // Direct RTO Scrappage Form State
  const [scrapVehicleId, setScrapVehicleId] = useState("");
  const [scrapReason, setScrapReason] = useState(SCRAP_REASONS[0]);

  const [stateFilter, setStateFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectVehicle, setInspectVehicle] = useState(null);
  const [viewRcVehicle, setViewRcVehicle] = useState(null);

  // Active (non-scrapped) vehicles
  const activeVehicles = useMemo(() => {
    return vehicles.filter((v) => v.state !== 1);
  }, [vehicles]);

  // Scrapped vehicles
  const scrappedVehicles = useMemo(() => {
    return vehicles.filter((v) => v.state === 1);
  }, [vehicles]);

  // Pending transfer requests awaiting RTO approval
  const pendingTransferRequests = useMemo(() => {
    return vehicles.filter((v) => v.pendingTransferTo && v.state !== 1);
  }, [vehicles]);

  // Pending scrappage requests awaiting RTO approval
  const pendingScrapRequests = useMemo(() => {
    return vehicles.filter((v) => v.pendingScrapRequest && v.state !== 1);
  }, [vehicles]);

  // Completed transfers
  const completedRtoTransfers = useMemo(() => {
    return vehicles.filter((v) => v.previousOwner || (v.history && v.history.length > 1));
  }, [vehicles]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    const holder = regForm.titleHolder.trim();
    if (!ethers.isAddress(holder)) {
      setFeedbackMsg("Please provide a valid 42-character Ethereum address for the Citizen Owner.");
      setFeedbackType("error");
      return;
    }

    const res = await registerVehicle({
      vin: regForm.vin.trim().toUpperCase(),
      regNumber: regForm.regNumber.trim().toUpperCase(),
      make: regForm.make.trim(),
      model: regForm.model.trim(),
      year: regForm.year,
      titleHolder: holder
    });

    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
      setRegForm({
        vin: generateIndianVin("MAT"),
        regNumber:
          "MH 12 " +
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          " " +
          Math.floor(1000 + Math.random() * 9000),
        make: "Tata",
        model: "Nexon EV Max",
        year: "2024",
        titleHolder: holder
      });
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // RTO Intermediary Approves Pending Request
  const handleApproveTransfer = async (vehicle) => {
    setFeedbackMsg("");
    const res = await approveTransferByRTO(vehicle.vehicleId, vehicle.pendingTransferTo);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // RTO Intermediary Rejects Pending Request
  const handleRejectTransfer = async (vehicleId) => {
    setFeedbackMsg("");
    const res = await cancelTransfer(vehicleId);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("info");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // Direct RTO Desk Transfer between Old Owner and New Owner
  const handleDirectRtoTransferSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    if (!directTransferVehicleId) {
      setFeedbackMsg("Please select an active registered vehicle to transfer.");
      setFeedbackType("error");
      return;
    }

    const cleanBuyer = directNewOwnerWallet.trim();
    if (!ethers.isAddress(cleanBuyer)) {
      setFeedbackMsg("Please enter a valid 42-character Ethereum address for the New Owner.");
      setFeedbackType("error");
      return;
    }

    const res = await approveTransferByRTO(directTransferVehicleId, cleanBuyer);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
      setDirectTransferVehicleId("");
      setDirectNewOwnerWallet("");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // RTO Approves Citizen Scrappage Request
  const handleApproveScrapRequest = async (vehicle) => {
    setFeedbackMsg("");
    const res = await scrapVehicle(
      vehicle.vehicleId,
      vehicle.scrapRequestReason || "Voluntary Owner Scrappage Approved by RTO"
    );
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // RTO Rejects Citizen Scrappage Request
  const handleRejectScrapRequest = async (vehicleId) => {
    setFeedbackMsg("");
    const res = await cancelScrapRequest(vehicleId);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("info");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // Direct RTO Vehicle Scrappage Form Submit
  const handleDirectScrapSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    if (!scrapVehicleId) {
      setFeedbackMsg("Please select an active vehicle to scrap.");
      setFeedbackType("error");
      return;
    }

    const res = await scrapVehicle(scrapVehicleId, scrapReason.trim() || SCRAP_REASONS[0]);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
      setScrapVehicleId("");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  // 1-Click switch to the New Owner's Citizen Portal
  const handleSwitchToCitizenOwner = async (ownerAddress) => {
    if (!ownerAddress) return;
    logout();
    const res = await selectLocalAccount(ownerAddress);
    const authRes = await authenticateAsAddress(ownerAddress, readContract || res?.contract, "CITIZEN");
    if (authRes.success) {
      navigate("/user");
    } else {
      navigate("/login", { state: { targetPortal: "CITIZEN" } });
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchState =
        stateFilter === "ALL" ||
        (v.regNumber || "").toUpperCase().startsWith(stateFilter) ||
        (stateFilter === "BH" && (v.regNumber || "").toUpperCase().includes("BH"));

      const q = searchTerm.trim().toUpperCase();
      const matchSearch =
        !q ||
        (v.regNumber || "").toUpperCase().includes(q) ||
        (v.make || "").toUpperCase().includes(q) ||
        (v.model || "").toUpperCase().includes(q) ||
        (v.titleHolder || "").toLowerCase().includes(q.toLowerCase());

      return matchState && matchSearch;
    });
  }, [vehicles, stateFilter, searchTerm]);

  const selectedDirectVehicle = useMemo(() => {
    return vehicles.find((v) => v.vehicleId === directTransferVehicleId) || null;
  }, [vehicles, directTransferVehicleId]);

  const selectedScrapVehicle = useMemo(() => {
    return vehicles.find((v) => v.vehicleId === scrapVehicleId) || null;
  }, [vehicles, scrapVehicleId]);

  return (
    <div className="page-container">
      {/* Official Government Registrar Terminal Header */}
      <div className="portal-hero rto-hero">
        <div className="portal-hero-text">
          <div className="portal-tagline">
            <span className="portal-badge-code rto">REGIONAL TRANSPORT OFFICE TERMINAL</span>
            <span className="portal-badge-role rto">REGISTRAR & INTERMEDIARY AUTHORITY</span>
          </div>

          <h2 className="portal-hero-title">
            <Building2 size={22} className="text-blue" />
            <span>RTO Vehicle Registration & Title Administration</span>
          </h2>

          <div className="portal-meta-strip">
            <span className="portal-meta-label">RTO WALLET:</span>
            <code className="portal-meta-val">{maskAddress(authenticatedAddress)}</code>
            <span className="dot-sep">•</span>
            <span className="portal-meta-label">DESK ROLE:</span>
            <span className="portal-meta-val" style={{ color: "#93c5fd" }}>New Reg • Transfer Intermediary • Decommissioning</span>
            <button
              type="button"
              className="chip-btn switch-chip"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <RefreshCw size={11} />
              <span>Switch Wallet</span>
            </button>
          </div>
        </div>

        <div className="portal-stats-row">
          <div className="stat-pill">
            <span className="stat-pill-label">Active on Road</span>
            <span className="stat-pill-value" style={{ color: "var(--green-india)" }}>
              {activeVehicles.length}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Pending Transfers</span>
            <span className="stat-pill-value" style={{ color: "var(--saffron)" }}>
              {pendingTransferRequests.length}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Decommissioned</span>
            <span className="stat-pill-value" style={{ color: "#f87171" }}>
              {scrappedVehicles.length}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Banner for Pending Transfer Requests */}
      {pendingTransferRequests.length > 0 && activeTab !== "transfer" && (
        <div className="rto-urgent-banner saffron">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={16} className="text-saffron" />
            <span>
              <strong>{pendingTransferRequests.length} Pending Ownership Transfer Request(s)</strong> awaiting RTO Intermediary clearance!
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: "7px 14px", fontSize: "12px" }}
            onClick={() => setActiveTab("transfer")}
          >
            Review Clearance Queue →
          </button>
        </div>
      )}

      {/* Alert Banner for Pending Scrappage Requests */}
      {pendingScrapRequests.length > 0 && activeTab !== "scrap" && (
        <div className="rto-urgent-banner red">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Trash2 size={16} className="text-red" />
            <span>
              <strong>{pendingScrapRequests.length} Pending Vehicle Scrappage Request(s)</strong> awaiting RTO Decommission approval!
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: "7px 14px", fontSize: "12px", background: "#dc2626" }}
            onClick={() => setActiveTab("scrap")}
          >
            Review Scrappage Queue →
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className={`status-banner ${feedbackType}`} style={{ marginBottom: "20px" }}>
          <span>{feedbackMsg}</span>
          <button
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}
            onClick={() => setFeedbackMsg("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* Handcrafted RTO Navigation Tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab-btn ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          <FilePlus size={15} />
          <span>Register New Vehicle (Form 20)</span>
        </button>

        <button
          className={`sub-tab-btn ${activeTab === "transfer" ? "active" : ""}`}
          onClick={() => setActiveTab("transfer")}
        >
          <ArrowLeftRight size={15} />
          <span>Ownership Transfer Intermediary</span>
          {pendingTransferRequests.length > 0 && (
            <span className="count-bubble saffron">
              {pendingTransferRequests.length}
            </span>
          )}
        </button>

        <button
          className={`sub-tab-btn ${activeTab === "scrap" ? "active" : ""}`}
          onClick={() => setActiveTab("scrap")}
        >
          <Trash2 size={15} />
          <span>Scrap & Decommission</span>
          {pendingScrapRequests.length > 0 && (
            <span className="count-bubble red">
              {pendingScrapRequests.length}
            </span>
          )}
        </button>

        <button
          className={`sub-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <Layers size={15} />
          <span>Vehicle Registry Ledger ({vehicles.length})</span>
        </button>
      </div>

      {/* TAB 1: FORM 20 - REGISTER NEW VEHICLE */}
      {activeTab === "register" && (
        <div className="card-box">
          <div className="card-box-header">
            <span className="docket-mini-tag">CENTRAL MOTOR VEHICLES RULES 1989</span>
            <h3 style={{ margin: "4px 0 6px" }}>
              <FilePlus size={17} className="text-blue" />
              <span>FORM 20 • Application & Issuance of New Vehicle Registration</span>
            </h3>
            <p className="card-desc" style={{ margin: 0 }}>
              Mint a verifiable ERC-721 Digital Title Certificate on the blockchain ledger. Ensures cryptographic uniqueness of chassis number and registration plate.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} style={{ marginTop: "22px" }}>
            <div className="form-grid">
              <div className="input-field">
                <label>
                  <span>Registration Plate Number</span>
                  <span style={{ fontSize: "11px", color: "var(--primary)" }}>e.g. MH 12 AB 1234</span>
                </label>
                <input
                  className="mono-input"
                  placeholder="MH 12 AB 1234"
                  value={regForm.regNumber}
                  onChange={(e) => setRegForm({ ...regForm, regNumber: e.target.value.toUpperCase() })}
                  required
                />
                <div className="quick-chips">
                  <span style={{ fontSize: "10px", color: "var(--text-dim)", alignSelf: "center" }}>State Prefix:</span>
                  {STATE_SERIES.map((st) => (
                    <button
                      type="button"
                      key={st.code}
                      className={`chip-btn ${regForm.regNumber.startsWith(st.code) ? "active" : ""}`}
                      onClick={() => {
                        const randomNum = Math.floor(1000 + Math.random() * 9000);
                        setRegForm({
                          ...regForm,
                          regNumber: st.code === "BH" ? `23 BH ${randomNum} CD` : `${st.code} 12 AB ${randomNum}`
                        });
                      }}
                    >
                      {st.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-field">
                <label>
                  <span>Chassis Number / VIN (17 Chars)</span>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => setRegForm({ ...regForm, vin: generateIndianVin("MAT") })}
                  >
                    🎲 Generate VIN
                  </button>
                </label>
                <input
                  className="mono-input"
                  placeholder="17 Character VIN"
                  maxLength={17}
                  value={regForm.vin}
                  onChange={(e) => setRegForm({ ...regForm, vin: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="input-field">
                <label>Make (Manufacturer)</label>
                <input
                  placeholder="e.g. Tata, Mahindra, Maruti Suzuki"
                  value={regForm.make}
                  onChange={(e) => setRegForm({ ...regForm, make: e.target.value })}
                  required
                />
              </div>

              <div className="input-field">
                <label>Model</label>
                <input
                  placeholder="e.g. Nexon EV Max, XUV700"
                  value={regForm.model}
                  onChange={(e) => setRegForm({ ...regForm, model: e.target.value })}
                  required
                />
              </div>

              <div className="input-field">
                <label>Year of Manufacture</label>
                <select
                  value={regForm.year}
                  onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-field">
                <label>Citizen Owner Wallet Address</label>
                <input
                  className="mono-input"
                  placeholder="0x... (Citizen Ethereum Wallet Address)"
                  value={regForm.titleHolder}
                  onChange={(e) => setRegForm({ ...regForm, titleHolder: e.target.value })}
                  required
                />
                <div className="quick-chips" style={{ marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)", alignSelf: "center" }}>
                    Citizen Wallets:
                  </span>
                  {citizenWallets.map((w) => (
                    <button
                      type="button"
                      key={w.address}
                      className={`chip-btn ${regForm.titleHolder.toLowerCase() === w.address.toLowerCase() ? "active" : ""}`}
                      onClick={() => setRegForm({ ...regForm, titleHolder: w.address })}
                    >
                      {w.label} ({maskAddress(w.address)})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--text-dim)", marginRight: "8px" }}>
                Quick Presets:
              </span>
              <div className="quick-chips" style={{ display: "inline-flex" }}>
                {POPULAR_CAR_PRESETS.slice(0, 5).map((car) => (
                  <button
                    type="button"
                    key={car.model}
                    className="chip-btn"
                    onClick={() => setRegForm({ ...regForm, make: car.make, model: car.model })}
                  >
                    {car.make} {car.model}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>HSRP Plate Specification:</span>
              <HSRPPlate plate={regForm.regNumber} size="normal" />
            </div>

            <button
              className="btn-primary"
              disabled={busy}
              type="submit"
              style={{ width: "100%", padding: "13px 20px", fontSize: "14px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <FilePlus size={16} />
              <span>{busy ? "Registering on Blockchain..." : "Issue Digital Registration Certificate (RC)"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: OWNERSHIP TRANSFER INTERMEDIARY */}
      {activeTab === "transfer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Intermediary Procedure Blueprint */}
          <div className="official-procedure-box">
            <div className="procedure-header">
              <span className="procedure-tag">FORM 29 & 30 • RTO VERIFIED INTERMEDIARY CLEARANCE</span>
              <span className="procedure-code">RULE 55(1)</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#93c5fd", lineHeight: "1.5" }}>
              The RTO acts as the legal regulatory intermediary between the Old Owner (Seller) and the New Owner (Buyer). Title ownership is cryptographically reassigned only upon RTO signature.
            </p>
          </div>

          {/* Section 1: Pending Citizen Requests Awaiting Clearance */}
          <div className="card-box" style={{ border: pendingTransferRequests.length > 0 ? "1.5px solid #f97316" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={17} className="text-saffron" />
                  <span>Citizen Ownership Transfer Queue (Old Owner → RTO → New Owner)</span>
                </h3>
                <p className="card-desc" style={{ margin: 0 }}>
                  Transfer applications submitted by registered owners awaiting verification.
                </p>
              </div>
              <span className="count-bubble saffron">
                {pendingTransferRequests.length} Pending Clearance
              </span>
            </div>

            {pendingTransferRequests.length === 0 ? (
              <div className="empty-state-docket small">
                <CheckCircle2 size={24} className="text-green" />
                <div style={{ marginTop: "6px" }}>Clearance queue empty. All pending citizen transfers processed.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {pendingTransferRequests.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="pending-queue-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <HSRPPlate plate={v.regNumber} size="normal" />
                      <div>
                        <div style={{ fontWeight: "700", color: "#f8fafc", fontSize: "15px" }}>
                          {v.make} {v.model} ({v.year})
                        </div>
                        <div className="queue-route-strip" style={{ marginTop: "4px" }}>
                          <span>Old Owner: <code>{maskAddress(v.titleHolder)}</code></span>
                          <span className="route-arrow">→ [RTO Intermediary] →</span>
                          <span>New Owner: <code className="text-green">{maskAddress(v.pendingTransferTo)}</code></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => handleApproveTransfer(v)}
                        style={{ padding: "9px 16px", fontSize: "12.5px", background: "#059669", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <UserCheck size={14} />
                        <span>{busy ? "Processing..." : "Approve & Reassign Title"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => handleRejectTransfer(v.vehicleId)}
                        style={{ padding: "9px 12px", fontSize: "12px" }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Direct RTO Desk Transfer Form */}
          <div className="card-box">
            <div className="card-box-header">
              <span className="docket-mini-tag">DIRECT REGISTRAR ACTION</span>
              <h3 style={{ margin: "4px 0 6px" }}>
                <ArrowLeftRight size={17} className="text-blue" />
                <span>Direct Ownership Transfer at RTO Counter</span>
              </h3>
              <p className="card-desc" style={{ margin: 0 }}>
                Directly reassign title from the current recorded owner to a new citizen buyer wallet.
              </p>
            </div>

            <form onSubmit={handleDirectRtoTransferSubmit} style={{ marginTop: "18px" }}>
              <div className="form-grid">
                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Select Active Registered Vehicle</label>
                  <select
                    value={directTransferVehicleId}
                    onChange={(e) => {
                      setDirectTransferVehicleId(e.target.value);
                      const matched = activeVehicles.find((v) => v.vehicleId === e.target.value);
                      if (matched?.pendingTransferTo) {
                        setDirectNewOwnerWallet(matched.pendingTransferTo);
                      }
                    }}
                    required
                  >
                    <option value="">-- Choose an active registered vehicle --</option>
                    {activeVehicles.map((v) => (
                      <option key={v.vehicleId} value={v.vehicleId}>
                        {v.regNumber} — {v.make} {v.model} (Old Owner: {maskAddress(v.titleHolder)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDirectVehicle && (
                  <div className="rto-verified-preview">
                    <div>
                      <strong>Current Recorded Owner:</strong> <code>{selectedDirectVehicle.titleHolder}</code>
                    </div>
                    <span className="verified-tag">✓ RTO Verified</span>
                  </div>
                )}

                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>New Owner Citizen Wallet Address</label>
                  <input
                    className="mono-input"
                    placeholder="0x... (New Owner Citizen Wallet Address)"
                    value={directNewOwnerWallet}
                    onChange={(e) => setDirectNewOwnerWallet(e.target.value)}
                    required
                  />
                  <div className="quick-chips" style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", alignSelf: "center" }}>
                      Quick Select Recipient:
                    </span>
                    {citizenWallets
                      .filter(
                        (w) =>
                          !selectedDirectVehicle ||
                          w.address.toLowerCase() !== selectedDirectVehicle.titleHolder?.toLowerCase()
                      )
                      .map((w) => (
                        <button
                          type="button"
                          key={w.address}
                          className={`chip-btn ${directNewOwnerWallet.toLowerCase() === w.address.toLowerCase() ? "active" : ""}`}
                          onClick={() => setDirectNewOwnerWallet(w.address)}
                        >
                          {w.label} ({maskAddress(w.address)})
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={busy || !directTransferVehicleId}
                style={{ width: "100%", marginTop: "14px", padding: "12px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                <ArrowLeftRight size={15} />
                <span>
                  {busy ? "Reassigning Title..." : "Execute Transfer & Update Ledger (Old Owner → New Owner)"}
                </span>
              </button>
            </form>
          </div>

          {/* Section 3: Completed Transfers History */}
          {completedRtoTransfers.length > 0 && (
            <div className="card-box">
              <div className="card-box-header">
                <span className="docket-mini-tag green">AUDIT PROVENANCE</span>
                <h3 style={{ margin: "4px 0 12px" }}>
                  <CheckCircle2 size={17} className="text-green" />
                  <span>Completed Ownership Transfers via RTO Desk ({completedRtoTransfers.length})</span>
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {completedRtoTransfers.map((v) => {
                  const prevOwner =
                    v.previousOwner ||
                    (v.history && v.history.length >= 2 ? v.history[v.history.length - 2].owner : "Initial Owner");

                  return (
                    <div
                      key={v.vehicleId}
                      className="completed-transfer-row"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <HSRPPlate plate={v.regNumber} size="small" />
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "13.5px" }}>
                            {v.make} {v.model} ({v.year})
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            Seller: <code>{maskAddress(prevOwner)}</code> → <strong>RTO Approved</strong> → Buyer:{" "}
                            <code className="text-green">{maskAddress(v.titleHolder)}</code>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setInspectVehicle(v)}
                          style={{ padding: "6px 10px", fontSize: "11.5px" }}
                        >
                          Provenance Log
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleSwitchToCitizenOwner(v.titleHolder)}
                          style={{ padding: "6px 12px", fontSize: "11.5px" }}
                        >
                          Inspect Owner RC →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCRAP & DECOMMISSION DESK */}
      {activeTab === "scrap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="official-procedure-box red-accent">
            <div className="procedure-header">
              <span className="procedure-tag red">FORM 35 • PERMANENT TITLE DECOMMISSIONING & SCRAPPAGE</span>
              <span className="procedure-code">RVSF CERTIFICATION</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#fca5a5", lineHeight: "1.5" }}>
              Permanent cancellation of registration under Section 55 of Motor Vehicles Act 1988. Sets lifecycle state to SCRAPPED on the cryptographic ledger and invalidates all future transfers.
            </p>
          </div>

          {/* Section 1: Pending Citizen Scrappage Applications */}
          <div className="card-box" style={{ border: pendingScrapRequests.length > 0 ? "1.5px solid #ef4444" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trash2 size={17} className="text-red" />
                  <span>Pending Citizen Scrappage Applications (Owner → RTO Clearance)</span>
                </h3>
                <p className="card-desc" style={{ margin: 0 }}>
                  Voluntary end-of-life scrappage applications submitted by citizens.
                </p>
              </div>
              <span className="count-bubble red">
                {pendingScrapRequests.length} Pending Approval
              </span>
            </div>

            {pendingScrapRequests.length === 0 ? (
              <div className="empty-state-docket small">
                <CheckCircle2 size={24} className="text-green" />
                <div style={{ marginTop: "6px" }}>No pending citizen scrappage applications.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {pendingScrapRequests.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="pending-queue-item scrap"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <HSRPPlate plate={v.regNumber} size="normal" />
                      <div>
                        <div style={{ fontWeight: "700", color: "#f8fafc", fontSize: "15px" }}>
                          {v.make} {v.model} ({v.year})
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#cbd5e1", marginTop: "4px" }}>
                          Owner: <code>{v.titleHolder}</code>
                        </div>
                        <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "4px" }}>
                          Declared Reason: <strong>{v.scrapRequestReason || "Voluntary End-of-Life Scrappage"}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => handleApproveScrapRequest(v)}
                        style={{ padding: "9px 16px", fontSize: "12.5px", background: "#dc2626", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Trash2 size={14} />
                        <span>{busy ? "Decommissioning..." : "Approve & Permanently Scrap"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => handleRejectScrapRequest(v.vehicleId)}
                        style={{ padding: "9px 12px", fontSize: "12px" }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Direct RTO Vehicle Scrappage Desk */}
          <div className="card-box">
            <div className="card-box-header">
              <span className="docket-mini-tag red">DIRECT AUTHORITY CONDEMNATION</span>
              <h3 style={{ margin: "4px 0 6px" }}>
                <Trash2 size={17} className="text-red" />
                <span>Direct Vehicle Decommissioning by RTO Authority</span>
              </h3>
              <p className="card-desc" style={{ margin: 0 }}>
                Select any active vehicle to issue an irrevocable Certificate of Decommissioning on the blockchain ledger.
              </p>
            </div>

            <form onSubmit={handleDirectScrapSubmit} style={{ marginTop: "18px" }}>
              <div className="form-grid">
                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Select Active Vehicle to Scrap</label>
                  <select
                    value={scrapVehicleId}
                    onChange={(e) => setScrapVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an active registered vehicle --</option>
                    {activeVehicles.map((v) => (
                      <option key={v.vehicleId} value={v.vehicleId}>
                        {v.regNumber} — {v.make} {v.model} ({v.year}) — Owner: {maskAddress(v.titleHolder)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedScrapVehicle && (
                  <div className="rto-verified-preview red">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <HSRPPlate plate={selectedScrapVehicle.regNumber} size="small" />
                      <span>
                        <strong>{selectedScrapVehicle.make} {selectedScrapVehicle.model}</strong> • Owner: <code>{selectedScrapVehicle.titleHolder}</code>
                      </span>
                    </div>
                    <span className="verified-tag red">⚠️ Terminal Decommissioning</span>
                  </div>
                )}

                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Official Regulatory Scrappage Reason</label>
                  <input
                    placeholder="Enter reason for vehicle scrappage"
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    required
                  />
                  <div className="quick-chips" style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", alignSelf: "center" }}>
                      Standard Grounds:
                    </span>
                    {SCRAP_REASONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        className={`chip-btn ${scrapReason === r ? "active" : ""}`}
                        onClick={() => setScrapReason(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={busy || !scrapVehicleId}
                style={{ width: "100%", marginTop: "14px", padding: "12px", background: "#dc2626", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                <Trash2 size={15} />
                <span>
                  {busy ? "Decommissioning Title..." : "Permanently Scrap & Decommission Vehicle"}
                </span>
              </button>
            </form>
          </div>

          {/* Section 3: Decommissioned Vehicles Registry */}
          {scrappedVehicles.length > 0 && (
            <div className="card-box">
              <div className="card-box-header">
                <span className="docket-mini-tag red">DECOMMISSIONED ARCHIVE</span>
                <h3 style={{ margin: "4px 0 12px" }}>
                  <Trash2 size={17} className="text-red" />
                  <span>Decommissioned & Scrapped Registry ({scrappedVehicles.length})</span>
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scrappedVehicles.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="scrapped-registry-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <HSRPPlate plate={v.regNumber} size="small" />
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#cbd5e1" }}>
                          {v.make} {v.model} ({v.year})
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Last Owner: <code>{maskAddress(v.titleHolder)}</code> • Ground:{" "}
                          <strong style={{ color: "#fca5a5" }}>
                            {v.scrapReason || "End-of-Life Vehicle Scrappage"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="badge badge-Scrapped">DECOMMISSIONED</span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setInspectVehicle(v)}
                        style={{ padding: "6px 10px", fontSize: "11.5px" }}
                      >
                        Audit Record
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REGISTERED VEHICLES LEDGER */}
      {activeTab === "ledger" && (
        <div className="card-box">
          <div className="ledger-toolbar">
            <div>
              <div className="docket-mini-tag">FORM 24 • REGISTER OF MOTOR VEHICLES</div>
              <h3 style={{ margin: "4px 0 2px" }}>
                <Layers size={17} className="text-blue" />
                <span>State Motor Vehicle Archival Ledger</span>
              </h3>
              <p className="card-desc" style={{ margin: 0 }}>
                Central cryptographic index of motor vehicle certificates and ownership provenance.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-bar-wrap">
                <Search size={14} className="search-bar-icon" />
                <input
                  type="text"
                  placeholder="Search plate, VIN, model, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ledger-search-input"
                />
              </div>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="ledger-state-select"
              >
                <option value="ALL">All States</option>
                {STATE_SERIES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Registration Plate</th>
                  <th>Vehicle Details</th>
                  <th>Chassis VIN</th>
                  <th>Current Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "34px", color: "var(--text-muted)" }}>
                      No vehicle records match the active search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, idx) => (
                    <tr key={v.vehicleId}>
                      <td className="index-cell">
                        #{String(idx + 1).padStart(3, "0")}
                      </td>
                      <td>
                        <HSRPPlate plate={v.regNumber} size="normal" />
                      </td>
                      <td>
                        <strong>
                          {v.make} {v.model}
                        </strong>{" "}
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>({v.year})</span>
                      </td>
                      <td className="mono-cell">{v.vinMasked || maskIdentifier(v.vehicleId)}</td>
                      <td>
                        <div className="mono-cell" style={{ fontSize: "12px" }}>
                          {maskAddress(v.titleHolder)}
                        </div>
                      </td>
                      <td>
                        {v.state === 1 ? (
                          <span className="badge badge-Scrapped">Scrapped</span>
                        ) : v.pendingScrapRequest ? (
                          <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" }}>
                            Scrap Pending
                          </span>
                        ) : v.pendingTransferTo ? (
                          <span className="badge" style={{ background: "rgba(249, 115, 22, 0.2)", color: "#fdba74" }}>
                            Transfer Pending
                          </span>
                        ) : (
                          <span className="badge badge-Active">Active</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: "4px 9px", fontSize: "11px", color: "#93c5fd" }}
                            onClick={() => setViewRcVehicle(v)}
                            title="View Official Form 23 Certificate of Registration"
                          >
                            RC (Form 23)
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: "4px 9px", fontSize: "11px" }}
                            onClick={() => setInspectVehicle(v)}
                          >
                            Inspect
                          </button>
                          {v.state !== 1 && (
                            <button
                              className="btn-secondary"
                              style={{
                                padding: "4px 9px",
                                fontSize: "11px",
                                color: "#fca5a5",
                                borderColor: "rgba(239, 68, 68, 0.4)"
                              }}
                              onClick={() => {
                                setScrapVehicleId(v.vehicleId);
                                setActiveTab("scrap");
                              }}
                            >
                              Scrap
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provenance Record Modal */}
      {inspectVehicle && (
        <div className="modal-overlay" onClick={() => setInspectVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-category-tag">OFFICIAL AUDIT DOCKET</div>
                <h3 style={{ margin: "2px 0 0" }}>Motor Vehicle Provenance Record</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setInspectVehicle(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <HSRPPlate plate={inspectVehicle.regNumber} size="normal" />
            </div>

            <div className="rc-specs-grid" style={{ marginBottom: "16px" }}>
              <div className="rc-spec-item">
                <span className="rc-spec-label">Make & Model</span>
                <span className="rc-spec-val">
                  {inspectVehicle.make} {inspectVehicle.model} ({inspectVehicle.year})
                </span>
              </div>
              <div className="rc-spec-item">
                <span className="rc-spec-label">Lifecycle Status</span>
                {inspectVehicle.state === 1 ? (
                  <span className="rc-spec-val" style={{ color: "#f87171", fontWeight: "700" }}>
                    DECOMMISSIONED & SCRAPPED
                  </span>
                ) : (
                  <span className="rc-spec-val" style={{ color: "var(--green-india)" }}>
                    REGISTERED & ACTIVE
                  </span>
                )}
              </div>
              {inspectVehicle.state === 1 && inspectVehicle.scrapReason && (
                <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="rc-spec-label">Scrappage Ground</span>
                  <span className="rc-spec-val text-red">
                    {inspectVehicle.scrapReason}
                  </span>
                </div>
              )}
              <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                <span className="rc-spec-label">Recorded Owner Wallet</span>
                <span className="rc-spec-val mono-val">
                  {inspectVehicle.titleHolder}
                </span>
              </div>
              <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                <span className="rc-spec-label">Vehicle ID (ERC-721 Token Hash)</span>
                <span className="rc-spec-val mono-val" style={{ fontSize: "11px" }}>
                  {inspectVehicle.vehicleId}
                </span>
              </div>
            </div>

            {/* Ownership Timeline */}
            {inspectVehicle.history && inspectVehicle.history.length > 0 && (
              <div className="timeline-docket">
                <span className="timeline-docket-title">
                  📜 Official Chain of Title ({inspectVehicle.history.length} record{inspectVehicle.history.length === 1 ? "" : "s"}):
                </span>
                <div className="timeline-items-list">
                  {inspectVehicle.history.map((h, i) => (
                    <div
                      key={i}
                      className="timeline-item-card"
                    >
                      <div>
                        <strong style={{ color: i === inspectVehicle.history.length - 1 ? "var(--green-india)" : "#93c5fd" }}>
                          {i === 0 ? "Initial Registration" : `RTO Intermediary Transfer #${i}`}:
                        </strong>{" "}
                        <code style={{ color: "#cbd5e1" }}>{maskAddress(h.owner)}</code>
                      </div>
                      <span className="timeline-date">
                        {new Date(h.transferredAt * 1000).toLocaleString("en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setViewRcVehicle(inspectVehicle);
                  setInspectVehicle(null);
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <FileText size={13} />
                <span>Open Form 23 Certificate</span>
              </button>
              <button className="btn-secondary" onClick={() => setInspectVehicle(null)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Form 23 Registration Certificate Viewer Modal */}
      <DigitalRcModal
        vehicle={viewRcVehicle}
        isOpen={!!viewRcVehicle}
        onClose={() => setViewRcVehicle(null)}
      />

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </div>
  );
}
