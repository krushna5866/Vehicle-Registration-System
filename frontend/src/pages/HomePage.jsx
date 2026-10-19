import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  Cpu
} from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { useAuth } from "../context/AuthContext";
import HSRPPlate from "../components/HSRPPlate";

export default function HomePage() {
  const { verifyVehicle, vehicles } = useBlockchain();
  const { isAuthenticated, isRtoOfficer } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    const result = await verifyVehicle(q);
    setSearchResult(result);
    setIsSearching(false);
  };

  const samplePlates = ["MH 12 AB 1234", "DL 01 AB 9999", "KA 05 CD 4567"];

  return (
    <div className="page-container">
      {/* Official Registry Hero Docket */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="official-hero-seal">
            <span className="seal-text-top">GOVERNMENT OF INDIA</span>
            <span className="seal-bar saffron"></span>
            <span className="seal-bar white"></span>
            <span className="seal-bar green"></span>
            <span className="seal-text-bottom">CENTRAL MOTOR VEHICLES DATABASE</span>
          </div>

          <h1 className="hero-title">
            National Motor Vehicle Cryptographic Registry
          </h1>

          <p className="hero-subtitle">
            Immutable blockchain title registry administered under the Motor Vehicles Act 1988. Cryptographic vehicle registration, RTO intermediary ownership clearance, and permanent scrappage decommissioning.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <Link
                to={isRtoOfficer ? "/rto" : "/user"}
                className="btn-primary hero-cta-btn"
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                <span>Go to {isRtoOfficer ? "RTO Portal" : "Citizen Portal"}</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/login" className="btn-primary hero-cta-btn">
                  <KeyRound size={15} />
                  <span>Sign In with Wallet & Password</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Public Search & Verification Section */}
      <section className="search-section">
        <div className="card-box verification-terminal-box">
          <div className="terminal-top-strip">
            <div className="terminal-title-row">
              <Search size={16} className="text-saffron" />
              <span className="terminal-label">PUBLIC TITLE VERIFICATION TERMINAL</span>
            </div>
            <span className="live-records-tag">
              {vehicles.length} TITLE{vehicles.length === 1 ? "" : "S"} ON-CHAIN
            </span>
          </div>

          <p className="card-desc" style={{ margin: "4px 0 18px" }}>
            Query the state cryptographic ledger using an Indian HSRP Registration Plate (e.g., <code>MH 12 AB 1234</code>) or 17-character Chassis Number (VIN).
          </p>

          <form onSubmit={handleSearch} className="search-input-group">
            <div className="search-bar-inner">
              <span className="search-prefix">IND</span>
              <input
                className="search-input mono-input"
                placeholder="MH 12 AB 1234  or  MAT4453DMABC01234"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <button className="btn-primary search-submit-btn" type="submit" disabled={isSearching}>
              <Search size={15} />
              <span>{isSearching ? "Verifying..." : "Verify Title"}</span>
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="quick-search-samples">
            <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "600" }}>
              Registered Presets:
            </span>
            {vehicles.slice(0, 3).map((v) => (
              <button
                key={v.vehicleId}
                type="button"
                className="chip-btn"
                onClick={() => {
                  setSearchQuery(v.regNumber);
                  verifyVehicle(v.regNumber).then((r) => setSearchResult(r));
                }}
              >
                {v.regNumber} ({v.make})
              </button>
            ))}
          </div>

          {searchResult === "NOT_FOUND" && (
            <div className="search-not-found">
              <AlertTriangle size={18} />
              <span>
                No cryptographic title found on the ledger matching "<strong>{searchQuery}</strong>". Check the plate format or register the vehicle via the RTO Portal.
              </span>
            </div>
          )}

          {searchResult && typeof searchResult === "object" && searchResult.found && (
            <div className="verification-card">
              {searchResult.state === 1 && (
                <div className="rubber-scrap-stamp" style={{ top: "35px", right: "20px" }}>
                  <div className="rubber-stamp-inner">
                    <div className="rubber-stamp-title">★ DECOMMISSIONED & SCRAPPED ★</div>
                    <div className="rubber-stamp-sub">RTO MOTOR VEHICLES ACT 1988</div>
                    <div className="rubber-stamp-ref">REGISTRATION IRREVOCABLY CANCELLED</div>
                  </div>
                </div>
              )}

              <div className="verification-header">
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                      color: searchResult.state === 1 ? "#f87171" : "var(--green-india)"
                    }}
                  >
                    {searchResult.state === 1
                      ? "IRREVOCABLY DECOMMISSIONED VEHICLE"
                      : "AUTHENTICATED TITLE CERTIFICATE"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Cryptographic commitment verified against on-chain block state
                  </div>
                </div>

                {searchResult.state === 1 ? (
                  <span className="badge badge-Scrapped">
                    DEREGISTERED: SCRAPPED
                  </span>
                ) : (
                  <span className="badge badge-Active">
                    <CheckCircle2 size={13} />
                    <span>VERIFIED & ACTIVE</span>
                  </span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                <HSRPPlate plate={searchResult.plate} size="large" />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.01em" }}>
                    {searchResult.make} {searchResult.model}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                    Model Year: <strong>{searchResult.year}</strong>
                  </div>
                </div>
              </div>

              {searchResult.state === 1 && (
                <div className="scrap-notice-banner" style={{ marginBottom: "18px" }}>
                  <AlertTriangle size={16} className="text-red" />
                  <div>
                    <strong>Official Scrappage Audit Record:</strong> This vehicle registration has been permanently decommissioned by the Regional Transport Authority ({searchResult.scrapReason || "End-of-Life Vehicle Scrappage"}). It is legally condemned and prohibited from road use.
                  </div>
                </div>
              )}

              <div className="rc-specs-grid">
                <div className="rc-spec-item">
                  <span className="rc-spec-label">ERC-721 TOKEN ID (CHASSIS HASH)</span>
                  <span className="rc-spec-val mono-val">
                    {searchResult.vehicleId.slice(0, 12)}...{searchResult.vehicleId.slice(-10)}
                  </span>
                </div>
                <div className="rc-spec-item">
                  <span className="rc-spec-label">REGISTRATION TIMESTAMP</span>
                  <span className="rc-spec-val">
                    {new Date(searchResult.registeredAt * 1000).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Handcrafted Registry Capabilities Architecture */}
      <section className="info-cards-section">
        <div className="info-cards-grid">
          <div className="info-card">
            <div className="info-card-header">
              <span className="card-badge">FORM 20</span>
              <FileText size={20} className="text-blue" />
            </div>
            <h3>Cryptographic Registration</h3>
            <p>
              RTO Registrars issue digital ERC-721 tokens representing vehicle titles. Duplicate chassis VIN commitments and plate collisions are prevented at protocol level.
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <span className="card-badge saffron">FORM 29 & 30</span>
              <Building2 size={20} className="text-saffron" />
            </div>
            <h3>RTO Intermediary Transfer</h3>
            <p>
              Zero peer-to-peer bypass. The Old Owner submits a transfer request, verified by the RTO Authority before reassigning title to the New Owner.
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <span className="card-badge red">FORM 35</span>
              <ShieldCheck size={20} className="text-red" />
            </div>
            <h3>Irrevocable Scrappage</h3>
            <p>
              End-of-Life vehicles undergo terminal scrappage decommissioning. Registration certificates are permanently marked as decommissioned on the ledger.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
