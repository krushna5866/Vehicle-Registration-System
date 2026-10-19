import React, { useState, useMemo } from "react";
import { ethers } from "ethers";
import { Link, useNavigate } from "react-router-dom";
import {
  Car,
  ArrowLeftRight,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowRight,
  X,
  Sparkles,
  QrCode,
  Layers,
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBlockchain } from "../context/BlockchainContext";
import HSRPPlate from "../components/HSRPPlate";
import WalletModal from "../components/WalletModal";
import DigitalRcModal from "../components/DigitalRcModal";
import { maskAddress } from "../constants/vehicleConstants";

const CITIZEN_SCRAP_REASONS = [
  "Voluntary End-of-Life Vehicle Scrappage (ELV > 15 Years)",
  "Total Loss / Severe Accident Damage",
  "Handed Over to Registered Vehicle Scrapping Facility (RVSF)"
];

export default function CitizenPortalPage() {
  const { authenticatedAddress, authenticateAsAddress, logout } = useAuth();
  const {
    vehicles,
    initiateTransfer,
    cancelTransfer,
    requestScrapVehicle,
    cancelScrapRequest,
    selectLocalAccount,
    readContract,
    knownWallets,
    busy
  } = useBlockchain();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("my-vehicles"); // 'my-vehicles' | 'transfer' | 'scrap' | 'incoming'
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const [transferVehicleId, setTransferVehicleId] = useState("");
  const [buyerWallet, setBuyerWallet] = useState("");

  const [scrapVehicleId, setScrapVehicleId] = useState("");
  const [scrapReason, setScrapReason] = useState(CITIZEN_SCRAP_REASONS[0]);

  const [inspectVehicle, setInspectVehicle] = useState(null);
  const [viewRcVehicle, setViewRcVehicle] = useState(null);

  // Vehicles currently owned by this Citizen
  const myVehicles = useMemo(() => {
    if (!authenticatedAddress) return [];
    return vehicles.filter(
      (v) => v.titleHolder?.toLowerCase() === authenticatedAddress.toLowerCase()
    );
  }, [vehicles, authenticatedAddress]);

  // Active (non-scrapped) vehicles owned by this Citizen
  const myActiveVehicles = useMemo(() => {
    return myVehicles.filter((v) => v.state !== 1);
  }, [myVehicles]);

  // Vehicles where this Citizen (Old Owner) has requested a transfer via the RTO Intermediary
  const myPendingRequestsToRto = useMemo(() => {
    return myVehicles.filter((v) => v.pendingTransferTo && v.state !== 1);
  }, [myVehicles]);

  // Vehicles where this Citizen has requested scrappage via the RTO
  const myPendingScrapRequests = useMemo(() => {
    return myVehicles.filter((v) => v.pendingScrapRequest && v.state !== 1);
  }, [myVehicles]);

  // Vehicles being transferred TO this Citizen (New Owner), currently awaiting RTO Intermediary approval
  const incomingViaRto = useMemo(() => {
    if (!authenticatedAddress) return [];
    return vehicles.filter(
      (v) => v.pendingTransferTo?.toLowerCase() === authenticatedAddress.toLowerCase() && v.state !== 1
    );
  }, [vehicles, authenticatedAddress]);

  // Other Citizen wallets for quick recipient selection
  const otherCitizenWallets = useMemo(() => {
    return (knownWallets || []).filter(
      (w) => w.type === "CITIZEN" && w.address.toLowerCase() !== authenticatedAddress?.toLowerCase()
    );
  }, [knownWallets, authenticatedAddress]);

  // 1-Click switch to RTO Portal (Intermediary / Scrappage Authority)
  const handleSwitchToRtoPortal = async (targetTab = "transfer") => {
    const rtoAccount = (knownWallets || []).find((w) => w.type === "AUTHORITY");
    if (!rtoAccount) {
      navigate("/login", { state: { targetPortal: "RTO" } });
      return;
    }

    logout();
    const res = await selectLocalAccount(rtoAccount.address);
    const authRes = await authenticateAsAddress(
      rtoAccount.address,
      readContract || res?.contract,
      "RTO"
    );
    if (authRes.success) {
      navigate("/rto", { state: { activeTab: targetTab } });
    } else {
      navigate("/login", { state: { targetPortal: "RTO" } });
    }
  };

  // Step 1: Old Owner submits transfer request to RTO Intermediary
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    if (!transferVehicleId) {
      setFeedbackMsg("Please select one of your active registered vehicles to transfer.");
      setFeedbackType("error");
      return;
    }

    const cleanBuyer = buyerWallet.trim();
    if (!ethers.isAddress(cleanBuyer)) {
      setFeedbackMsg("Please enter a valid 42-character Ethereum address for the New Owner.");
      setFeedbackType("error");
      return;
    }

    if (cleanBuyer.toLowerCase() === authenticatedAddress?.toLowerCase()) {
      setFeedbackMsg("New Owner wallet address cannot be the same as the Old Owner.");
      setFeedbackType("error");
      return;
    }

    const res = await initiateTransfer(transferVehicleId, cleanBuyer);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
      setTransferVehicleId("");
      setBuyerWallet("");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  const handleCancelRequest = async (vehicleId) => {
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

  // Citizen submits Voluntary Scrappage Request to RTO
  const handleScrapRequestSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    if (!scrapVehicleId) {
      setFeedbackMsg("Please select one of your active vehicles to request scrappage.");
      setFeedbackType("error");
      return;
    }

    const res = await requestScrapVehicle(scrapVehicleId, scrapReason.trim() || CITIZEN_SCRAP_REASONS[0]);
    if (res.success) {
      setFeedbackMsg(res.message);
      setFeedbackType("success");
      setScrapVehicleId("");
    } else {
      setFeedbackMsg(res.error);
      setFeedbackType("error");
    }
  };

  const handleCancelScrapRequest = async (vehicleId) => {
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

  return (
    <div className="page-container">
      {/* Official Citizen Docket Header */}
      <div className="portal-hero citizen-hero">
        <div className="portal-hero-text">
          <div className="portal-tagline">
            <span className="portal-badge-code">VAHAN CITIZEN DOCKET</span>
            <span className="portal-badge-role">VERIFIED CITIZEN TITLEHOLDER</span>
          </div>

          <h2 className="portal-hero-title">
            <Car size={22} className="text-saffron" />
            <span>Citizen Motor Vehicle Portfolio</span>
          </h2>

          <div className="portal-meta-strip">
            <span className="portal-meta-label">AUTHENTICATED WALLET:</span>
            <code className="portal-meta-val">{maskAddress(authenticatedAddress)}</code>
            <span className="dot-sep">•</span>
            <span className="portal-meta-label">STANDARD PASSWORD:</span>
            <code className="portal-meta-val">1234</code>
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
            <span className="stat-pill-label">Registered Titles</span>
            <span className="stat-pill-value" style={{ color: "var(--green-india)" }}>
              {myVehicles.length}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Active on Road</span>
            <span className="stat-pill-value" style={{ color: "#38bdf8" }}>
              {myActiveVehicles.length}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Pending RTO Action</span>
            <span className="stat-pill-value" style={{ color: "var(--saffron)" }}>
              {myPendingRequestsToRto.length + myPendingScrapRequests.length}
            </span>
          </div>
        </div>
      </div>

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

      {/* Handcrafted Segmented Navigation Controls */}
      <div className="sub-tabs">
        <button
          className={`sub-tab-btn ${activeTab === "my-vehicles" ? "active" : ""}`}
          onClick={() => setActiveTab("my-vehicles")}
        >
          <Car size={15} />
          <span>My Registered Vehicles ({myVehicles.length})</span>
        </button>

        <button
          className={`sub-tab-btn ${activeTab === "transfer" ? "active" : ""}`}
          onClick={() => setActiveTab("transfer")}
        >
          <ArrowLeftRight size={15} />
          <span>Transfer Ownership (via RTO Intermediary)</span>
          {myPendingRequestsToRto.length > 0 && (
            <span className="count-bubble saffron">
              {myPendingRequestsToRto.length}
            </span>
          )}
        </button>

        <button
          className={`sub-tab-btn ${activeTab === "scrap" ? "active" : ""}`}
          onClick={() => setActiveTab("scrap")}
        >
          <Trash2 size={15} />
          <span>Scrap Vehicle</span>
          {myPendingScrapRequests.length > 0 && (
            <span className="count-bubble red">
              {myPendingScrapRequests.length}
            </span>
          )}
        </button>

        {incomingViaRto.length > 0 && (
          <button
            className={`sub-tab-btn ${activeTab === "incoming" ? "active" : ""}`}
            onClick={() => setActiveTab("incoming")}
          >
            <Clock size={15} />
            <span>Incoming at RTO ({incomingViaRto.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: MY REGISTERED VEHICLES (BESPOKE DIGITAL RC SMART CARDS) */}
      {activeTab === "my-vehicles" && (
        <div>
          {myVehicles.length === 0 ? (
            <div className="empty-state-docket">
              <div className="empty-state-icon">
                <Car size={36} className="text-saffron" />
              </div>
              <h3 className="empty-state-title">No Vehicles Registered to this Wallet</h3>
              <p className="empty-state-desc">
                Wallet <code>{authenticatedAddress}</code> does not currently hold any registered vehicle titles on the blockchain.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsWalletModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={13} />
                  <span>Switch Account (Citizen: 1234 / RTO: 4321)</span>
                </button>
                <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
                  Public Search & Verification
                </Link>
              </div>
            </div>
          ) : (
            <div className="rc-cards-grid">
              {myVehicles.map((car) => {
                const isScrapped = car.state === 1;

                return (
                  <div
                    className={`rc-smartcard ${isScrapped ? "scrapped-card" : ""}`}
                    key={car.vehicleId}
                  >
                    {/* Top Indian Tricolor Security Band */}
                    <div className="rc-card-top-tricolor"></div>

                    {/* Holographic Security Thread Strip */}
                    <div className="rc-card-hologram-thread">
                      <span>• GOVT OF INDIA • MOTOR VEHICLES ACT • BHARAT RC • CRYPTOGRAPHIC TITLE •</span>
                    </div>

                    <div className="rc-card-header">
                      <div className="rc-card-authority">
                        <div className="emv-gold-chip" title="Cryptographic EMV Smartcard Chip">
                          <div className="chip-trace t1"></div>
                          <div className="chip-trace t2"></div>
                          <div className="chip-trace t3"></div>
                          <div className="chip-center"></div>
                        </div>
                        <div>
                          <div className="rc-official-title">FORM 23 • CERTIFICATE OF REGISTRATION</div>
                          <div className="rc-official-sub">GOVERNMENT OF INDIA • TRANSPORT DEPARTMENT</div>
                        </div>
                      </div>

                      {isScrapped ? (
                        <div className="scrapped-pill-tag">
                          <span>DECOMMISSIONED</span>
                        </div>
                      ) : (
                        <div className="active-pill-tag">
                          <span className="live-dot"></span>
                          <span>ACTIVE RC</span>
                        </div>
                      )}
                    </div>

                    {/* Rubber Stamp for Scrapped Vehicles */}
                    {isScrapped && (
                      <div className="rubber-scrap-stamp">
                        <div className="rubber-stamp-inner">
                          <div className="rubber-stamp-title">★ DECOMMISSIONED & SCRAPPED ★</div>
                          <div className="rubber-stamp-sub">RTO MOTOR VEHICLES ACT 1988</div>
                          <div className="rubber-stamp-ref">PERMANENT TITLE CANCELLATION</div>
                        </div>
                      </div>
                    )}

                    <div className="rc-card-body">
                      {/* Realistic Embossed HSRP Plate Display */}
                      <div className="rc-plate-wrapper">
                        <HSRPPlate plate={car.regNumber} size="large" />
                      </div>

                      <div className="rc-specs-grid">
                        <div className="rc-spec-item">
                          <span className="rc-spec-label">VEHICLE MAKE & MODEL</span>
                          <span className="rc-spec-val highlight">
                            {car.make} {car.model}
                          </span>
                        </div>
                        <div className="rc-spec-item">
                          <span className="rc-spec-label">MANUFACTURE YEAR</span>
                          <span className="rc-spec-val">{car.year}</span>
                        </div>
                        <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                          <span className="rc-spec-label">CHASSIS NUMBER (MASKED VIN)</span>
                          <span className="rc-spec-val mono-val">
                            {car.vinMasked}
                          </span>
                        </div>
                        <div className="rc-spec-item">
                          <span className="rc-spec-label">REGISTRATION DATE</span>
                          <span className="rc-spec-val">
                            {new Date(car.registeredAt * 1000).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="rc-spec-item">
                          <span className="rc-spec-label">REGISTERED OWNER</span>
                          <span className="rc-spec-val">You ({maskAddress(authenticatedAddress)})</span>
                        </div>
                        {car.previousOwner && (
                          <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                            <span className="rc-spec-label">TRANSFERRED FROM (OLD OWNER)</span>
                            <span className="rc-spec-val provenance-val">
                              {maskAddress(car.previousOwner)} → Verified by RTO Intermediary
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Lifecycle Status & Actions */}
                      {isScrapped ? (
                        <div className="scrap-notice-banner">
                          <AlertTriangle size={15} className="text-red" />
                          <div>
                            <strong>Decommissioned & Scrapped:</strong> {car.scrapReason || "End-of-Life Vehicle Scrappage"}. This title is permanently retired.
                          </div>
                        </div>
                      ) : car.pendingScrapRequest ? (
                        <div className="pending-rto-banner scrap">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={14} />
                            <strong>Pending Scrappage Approval at RTO:</strong>
                          </div>
                          <div style={{ fontSize: "11.5px", marginTop: "2px", opacity: 0.9 }}>
                            {car.scrapRequestReason}
                          </div>
                          <div className="banner-actions-row">
                            <button
                              type="button"
                              onClick={() => handleSwitchToRtoPortal("scrap")}
                              className="btn-primary approve-switch-btn"
                            >
                              <Building2 size={12} />
                              <span>Switch to RTO to Approve →</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelScrapRequest(car.vehicleId)}
                              className="btn-secondary cancel-sub-btn"
                            >
                              Cancel Request
                            </button>
                          </div>
                        </div>
                      ) : car.pendingTransferTo ? (
                        <div className="pending-rto-banner transfer">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={14} />
                            <strong>Pending RTO Intermediary Transfer:</strong>
                          </div>
                          <div style={{ fontSize: "11.5px", marginTop: "2px", opacity: 0.9 }}>
                            Designated New Owner: <code>{maskAddress(car.pendingTransferTo)}</code>
                          </div>
                          <div className="banner-actions-row">
                            <button
                              type="button"
                              onClick={() => handleSwitchToRtoPortal("transfer")}
                              className="btn-primary approve-switch-btn"
                            >
                              <Building2 size={12} />
                              <span>Switch to RTO to Approve →</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(car.vehicleId)}
                              className="btn-secondary cancel-sub-btn"
                            >
                              Cancel Request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                          <button
                            className="btn-primary"
                            style={{ flex: 1, padding: "9px 14px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                            onClick={() => {
                              setTransferVehicleId(car.vehicleId);
                              setActiveTab("transfer");
                            }}
                          >
                            <ArrowLeftRight size={13} />
                            <span>Transfer via RTO</span>
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: "9px 12px", fontSize: "12px", color: "#fca5a5", borderColor: "rgba(239, 68, 68, 0.4)", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            onClick={() => {
                              setScrapVehicleId(car.vehicleId);
                              setActiveTab("scrap");
                            }}
                            title="Submit Scrappage Application to RTO"
                          >
                            <Trash2 size={13} />
                            <span>Scrap</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="rc-card-footer">
                      <button
                        className="btn-primary"
                        style={{ padding: "6px 12px", fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        onClick={() => setViewRcVehicle(car)}
                        title="Open Official Digital Registration Certificate (Form 23)"
                      >
                        <FileText size={12} />
                        <span>View Official RC (Form 23)</span>
                      </button>
                      <button
                        className="btn-secondary history-inspect-btn"
                        onClick={() => setInspectVehicle(car)}
                        title="View Ownership Provenance & Audit Trail"
                      >
                        <ShieldCheck size={12} />
                        <span>Provenance</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSFER OWNERSHIP (FORM 29 & 30 DOCKET) */}
      {activeTab === "transfer" && (
        <div style={{ maxWidth: "740px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Official Intermediary Flow Blueprint */}
          <div className="official-procedure-box">
            <div className="procedure-header">
              <span className="procedure-tag">FORM 29 & 30 • RTO VERIFIED TRANSFER DOCKET</span>
              <span className="procedure-code">RULE 55(1)</span>
            </div>
            <div className="procedure-steps-row">
              <div className="step-item">
                <span className="step-num">1</span>
                <div>
                  <div className="step-title">Old Owner Request</div>
                  <div className="step-sub">Initiates transfer on-chain</div>
                </div>
              </div>
              <span className="step-arrow">→</span>
              <div className="step-item highlight">
                <span className="step-num">2</span>
                <div>
                  <div className="step-title">RTO Intermediary</div>
                  <div className="step-sub">Verifies & approves title</div>
                </div>
              </div>
              <span className="step-arrow">→</span>
              <div className="step-item">
                <span className="step-num">3</span>
                <div>
                  <div className="step-title">New Owner</div>
                  <div className="step-sub">RC reassigned to wallet</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Transfer Requests Waiting at RTO */}
          {myPendingRequestsToRto.length > 0 && (
            <div className="card-box" style={{ border: "1px solid rgba(245, 158, 11, 0.45)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} className="text-saffron" />
                  <span>Submitted Requests Awaiting RTO Intermediary Approval</span>
                </h4>
                <span className="count-bubble saffron">
                  {myPendingRequestsToRto.length} Pending
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {myPendingRequestsToRto.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="pending-queue-item"
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <HSRPPlate plate={v.regNumber} size="small" />
                        <strong style={{ fontSize: "14px" }}>
                          {v.make} {v.model} ({v.year})
                        </strong>
                      </div>
                      <div className="queue-route-strip">
                        <span>Old Owner (You): <code>{maskAddress(v.titleHolder)}</code></span>
                        <span className="route-arrow">→ [RTO Intermediary] →</span>
                        <span>New Owner: <code className="text-green">{maskAddress(v.pendingTransferTo)}</code></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSwitchToRtoPortal("transfer")}
                        style={{ padding: "8px 14px", fontSize: "12px", background: "#2563eb", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Building2 size={13} />
                        <span>Switch to RTO Portal to Approve →</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => handleCancelRequest(v.vehicleId)}
                        style={{ padding: "8px 11px", fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Ownership Transfer Form */}
          <div className="card-box">
            <div className="card-box-header">
              <span className="docket-mini-tag">OFFICIAL FORM 29 APPLICATION</span>
              <h3 style={{ margin: "4px 0 6px" }}>
                <ArrowLeftRight size={17} className="text-saffron" />
                <span>Initiate Ownership Transfer Request</span>
              </h3>
              <p className="card-desc" style={{ margin: 0 }}>
                Select an active vehicle and enter the New Owner's Citizen Wallet Address. The transfer will be queued at the RTO Intermediary desk for verification.
              </p>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ marginTop: "18px" }}>
              <div className="form-grid">
                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Select Your Active Vehicle (Old Owner Title)</label>
                  <select
                    value={transferVehicleId}
                    onChange={(e) => setTransferVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an active vehicle you own --</option>
                    {myActiveVehicles
                      .filter((v) => !v.pendingTransferTo)
                      .map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.regNumber} — {v.make} {v.model} ({v.year})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>New Owner Citizen Wallet Address</label>
                  <input
                    className="mono-input"
                    placeholder="0x... (Enter New Owner Citizen Wallet Address)"
                    value={buyerWallet}
                    onChange={(e) => setBuyerWallet(e.target.value)}
                    required
                  />

                  {otherCitizenWallets.length > 0 && (
                    <div className="quick-chips" style={{ marginTop: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", alignSelf: "center" }}>
                        Quick Select Recipient:
                      </span>
                      {otherCitizenWallets.map((acc) => (
                        <button
                          type="button"
                          key={acc.address}
                          className={`chip-btn ${buyerWallet.toLowerCase() === acc.address.toLowerCase() ? "active" : ""}`}
                          onClick={() => setBuyerWallet(acc.address)}
                        >
                          {acc.label} ({maskAddress(acc.address)})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn-primary btn-saffron"
                type="submit"
                disabled={busy || myActiveVehicles.filter((v) => !v.pendingTransferTo).length === 0}
                style={{ width: "100%", marginTop: "14px", padding: "12px 18px", fontSize: "13.5px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                <ArrowLeftRight size={15} />
                <span>
                  {busy ? "Transmitting Transfer Request..." : "Submit Ownership Transfer Request to RTO Intermediary"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: VOLUNTARY SCRAPPAGE APPLICATION (FORM 35 DOCKET) */}
      {activeTab === "scrap" && (
        <div style={{ maxWidth: "740px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="official-procedure-box red-accent">
            <div className="procedure-header">
              <span className="procedure-tag red">FORM 35 • VOLUNTARY SCRAPPAGE & DECOMMISSIONING</span>
              <span className="procedure-code">RULE 58</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#fca5a5", lineHeight: "1.5" }}>
              Submit an End-of-Life Vehicle (ELV) or total loss scrappage application. Upon RTO Authority approval, the registration will be permanently decommissioned on-chain and assigned a terminal scrapped state.
            </p>
          </div>

          {myPendingScrapRequests.length > 0 && (
            <div className="card-box" style={{ border: "1px solid rgba(239, 68, 68, 0.45)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trash2 size={16} className="text-red" />
                  <span>Pending Scrappage Applications at RTO</span>
                </h4>
                <span className="count-bubble red">
                  {myPendingScrapRequests.length} Pending
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {myPendingScrapRequests.map((v) => (
                  <div
                    key={v.vehicleId}
                    className="pending-queue-item scrap"
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <HSRPPlate plate={v.regNumber} size="small" />
                        <strong>
                          {v.make} {v.model} ({v.year})
                        </strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "6px" }}>
                        Declared Reason: <strong>{v.scrapRequestReason}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSwitchToRtoPortal("scrap")}
                        style={{ padding: "8px 14px", fontSize: "12px", background: "#dc2626", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Building2 size={13} />
                        <span>Switch to RTO Portal to Approve Scrap →</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => handleCancelScrapRequest(v.vehicleId)}
                        style={{ padding: "8px 11px", fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-box">
            <div className="card-box-header">
              <span className="docket-mini-tag red">OFFICIAL FORM 35 DECOMMISSIONING APPLICATION</span>
              <h3 style={{ margin: "4px 0 6px" }}>
                <Trash2 size={17} className="text-red" />
                <span>Submit Vehicle Scrappage Application</span>
              </h3>
              <p className="card-desc" style={{ margin: 0 }}>
                Select an active vehicle to decommission and specify the regulatory reason for scrappage.
              </p>
            </div>

            <form onSubmit={handleScrapRequestSubmit} style={{ marginTop: "18px" }}>
              <div className="form-grid">
                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Select Your Active Vehicle</label>
                  <select
                    value={scrapVehicleId}
                    onChange={(e) => setScrapVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an active vehicle to decommission --</option>
                    {myActiveVehicles
                      .filter((v) => !v.pendingScrapRequest)
                      .map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.regNumber} — {v.make} {v.model} ({v.year})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="input-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Declared Reason for Scrappage</label>
                  <input
                    placeholder="Specify reason for vehicle scrappage"
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    required
                  />
                  <div className="quick-chips" style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", alignSelf: "center" }}>
                      Preset Reasons:
                    </span>
                    {CITIZEN_SCRAP_REASONS.map((r) => (
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
                disabled={busy || myActiveVehicles.filter((v) => !v.pendingScrapRequest).length === 0}
                style={{ width: "100%", marginTop: "14px", padding: "12px 18px", background: "#dc2626", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                <Trash2 size={15} />
                <span>
                  {busy ? "Filing Scrappage Application..." : "Submit Scrappage Application to RTO Authority"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: INCOMING TRANSFERS WAITING AT RTO */}
      {activeTab === "incoming" && incomingViaRto.length > 0 && (
        <div className="card-box" style={{ maxWidth: "740px", margin: "0 auto" }}>
          <div className="card-box-header">
            <span className="docket-mini-tag">INCOMING TITLE CLEARANCE</span>
            <h3 style={{ margin: "4px 0 6px" }}>
              <Clock size={17} className="text-saffron" />
              <span>Incoming Vehicle Titles at RTO Intermediary</span>
            </h3>
            <p className="card-desc" style={{ margin: 0 }}>
              The current owner has initiated a transfer designating you as the New Owner. The transfer is currently undergoing RTO Intermediary clearance.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
            {incomingViaRto.map((car) => (
              <div
                key={car.vehicleId}
                className="pending-queue-item"
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <HSRPPlate plate={car.regNumber} size="normal" />
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "15px" }}>
                        {car.make} {car.model} ({car.year})
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                        Seller (Old Owner): <code>{maskAddress(car.titleHolder)}</code> → <strong>RTO Desk</strong> → Buyer: <strong>You</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSwitchToRtoPortal("transfer")}
                  style={{ padding: "8px 14px", fontSize: "12px", background: "#2563eb", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Building2 size={13} />
                  <span>Switch to RTO to Approve →</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Provenance Modal */}
      {inspectVehicle && (
        <div className="modal-overlay" onClick={() => setInspectVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-category-tag">TITLE PROVENANCE & AUDIT TRAIL</div>
                <h3 style={{ margin: "2px 0 0" }}>Motor Vehicle Cryptographic Certificate</h3>
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
                  <span className="rc-spec-val" style={{ color: "var(--green-india)", fontWeight: "700" }}>
                    REGISTERED & ACTIVE
                  </span>
                )}
              </div>
              {inspectVehicle.state === 1 && inspectVehicle.scrapReason && (
                <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="rc-spec-label">Decommission Reason</span>
                  <span className="rc-spec-val text-red">
                    {inspectVehicle.scrapReason}
                  </span>
                </div>
              )}
              <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                <span className="rc-spec-label">Current Owner Wallet</span>
                <span className="rc-spec-val mono-val">
                  {inspectVehicle.titleHolder}
                </span>
              </div>
              <div className="rc-spec-item" style={{ gridColumn: "1 / -1" }}>
                <span className="rc-spec-label">ERC-721 Token ID (Chassis Hash)</span>
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
                <span>Open Official Form 23 RC</span>
              </button>
              <button className="btn-secondary" onClick={() => setInspectVehicle(null)}>
                Close Docket
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
