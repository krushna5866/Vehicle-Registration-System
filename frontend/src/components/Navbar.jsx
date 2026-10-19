import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  User,
  Building2,
  RefreshCw,
  LogOut,
  KeyRound,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBlockchain } from "../context/BlockchainContext";
import { maskAddress } from "../constants/vehicleConstants";
import WalletModal from "./WalletModal";

export default function Navbar() {
  const { authenticatedAddress, isRtoOfficer, isAuthenticated, logout } = useAuth();
  const { disconnectWallet, vehicles } = useBlockchain();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="gov-navbar">
      {/* Tricolor Security Thread Accent at top edge of navbar */}
      <div className="navbar-top-tricolor"></div>

      <div className="navbar-inner">
        {/* Government Authority Branding */}
        <div className="gov-branding">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div className="gov-emblem-badge" title="National Motor Vehicle Title Registry">
              {/* Detailed Ashoka Chakra Crest SVG */}
              <svg viewBox="0 0 36 36" className="emblem-svg" fill="none">
                <circle cx="18" cy="18" r="16.5" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 1.5" />
                <circle cx="18" cy="18" r="14.5" stroke="#3b82f6" strokeWidth="1" />
                <circle cx="18" cy="18" r="4" fill="#3b82f6" stroke="#f59e0b" strokeWidth="1" />
                {[...Array(24)].map((_, i) => (
                  <line
                    key={i}
                    x1="18"
                    y1="4.5"
                    x2="18"
                    y2="31.5"
                    stroke="#60a5fa"
                    strokeWidth="0.75"
                    transform={`rotate(${i * 15} 18 18)`}
                  />
                ))}
              </svg>
            </div>

            <div className="gov-title-group">
              <div className="gov-morth-tag">
                <span className="tricolor-dot saffron"></span>
                <span className="tricolor-dot white"></span>
                <span className="tricolor-dot green"></span>
                <span>MINISTRY OF ROAD TRANSPORT & HIGHWAYS</span>
              </div>
              <h1 className="gov-main-title">VAHAN TITLE LEDGER</h1>
              <p className="gov-subtitle">Cryptographic Motor Vehicle Registry • Bharat</p>
            </div>
          </Link>
        </div>

        {/* Primary Navigation - Custom Segmented Control */}
        <nav className="nav-links">
          <Link to="/" className={`nav-link-btn ${isActive("/") ? "active" : ""}`}>
            <Search size={14} className="nav-icon" />
            <span>Public Verification</span>
          </Link>
          <Link
            to="/user"
            className={`nav-link-btn ${isActive("/user") || isActive("/citizen") ? "active" : ""}`}
          >
            <User size={14} className="nav-icon" />
            <span>Citizen Portal</span>
          </Link>
          <Link to="/rto" className={`nav-link-btn ${isActive("/rto") ? "active" : ""}`}>
            <Building2 size={14} className="nav-icon" />
            <span>RTO Authority</span>
          </Link>
        </nav>

        {/* Live Network & Account Controls */}
        <div className="account-bar">
          <div className="network-live-pill" title="Cryptographic Title State: Synchronized">
            <span className="live-pulse-dot"></span>
            <span className="network-label">LEDGER LIVE</span>
            <span className="vehicle-count-tag" title="Total Registered Vehicles on Ledger">
              {vehicles.length} RC{vehicles.length === 1 ? "" : "s"}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="user-profile-badge">
              <div className="user-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="user-name">{maskAddress(authenticatedAddress)}</span>
                  <span className={`user-role-chip ${isRtoOfficer ? "officer" : "citizen"}`}>
                    {isRtoOfficer ? "RTO Authority" : "Citizen"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="chip-btn switch-btn"
                onClick={() => setIsWalletModalOpen(true)}
                title="Switch wallet account or portal"
              >
                <RefreshCw size={12} />
                <span>Switch</span>
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Sign Out of Session"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsWalletModalOpen(true)}
                style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCw size={12} />
                <span>Select Wallet</span>
              </button>
              <Link
                to="/login"
                className="btn-primary"
                style={{ padding: "7px 14px", fontSize: "12.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <KeyRound size={13} />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
}
