import React, { useState } from "react";
import { ethers } from "ethers";
import { useNavigate, useLocation } from "react-router-dom";
import {
  KeyRound,
  User,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBlockchain } from "../context/BlockchainContext";
import { maskAddress } from "../constants/vehicleConstants";

export default function LoginPage() {
  const {
    loginWithAddressAndPassword,
    isAuthenticated,
    authenticatedAddress,
    sessionType,
    isRtoOfficer,
    authError,
    clearAuthError,
    isAuthenticating,
    logout
  } = useAuth();

  const { selectLocalAccount, readContract, knownWallets, vehicles } = useBlockchain();

  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname;
  const initialPortal = location.state?.targetPortal || (fromPath?.startsWith("/rto") ? "RTO" : "CITIZEN");
  const [targetPortal, setTargetPortal] = useState(initialPortal);

  const citizenAccounts = (knownWallets || []).filter((w) => w.type === "CITIZEN");
  const authorityAccounts = (knownWallets || []).filter((w) => w.type === "AUTHORITY");

  const [loginAddress, setLoginAddress] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [localError, setLocalError] = useState("");
  const [infoNotice, setInfoNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getVehicleCount = (addr) => {
    return vehicles.filter((v) => v.titleHolder?.toLowerCase() === addr.toLowerCase()).length;
  };

  const handleAddressPasswordLogin = async (
    e,
    overrideAddress = null,
    overridePassword = null,
    overridePortal = null
  ) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    setLocalError("");
    setInfoNotice("");
    clearAuthError?.();

    const portalToUse = overridePortal || targetPortal;
    const addrToUse = (overrideAddress !== null ? overrideAddress : loginAddress).trim();
    const passToUse = String(overridePassword !== null ? overridePassword : loginPassword).trim();

    if (!addrToUse || !ethers.isAddress(addrToUse)) {
      setLocalError("Please enter or select a valid 42-character Wallet Address (0x...).");
      return;
    }

    const expectedPassword = portalToUse === "RTO" ? "4321" : "1234";
    if (passToUse !== expectedPassword) {
      setLocalError(
        portalToUse === "RTO"
          ? "Incorrect password for RTO Authority. Standard RTO Password is 4321."
          : "Incorrect password for Citizen Portal. Standard Citizen Password is 1234."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await selectLocalAccount(addrToUse);
      const contractToUse = readContract || res?.contract || null;

      const authRes = await loginWithAddressAndPassword(addrToUse, passToUse, contractToUse, portalToUse);
      if (!authRes.success) {
        setLocalError(authRes.error || "Authentication failed.");
        return;
      }

      navigate(authRes.sessionType === "RTO" ? "/rto" : "/user");
    } catch (err) {
      setLocalError(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAddress = (addr) => {
    setLoginAddress(addr);
    setLocalError("");
    clearAuthError?.();
    setInfoNotice(
      `Selected wallet ${maskAddress(addr)}. Enter password "${targetPortal === "RTO" ? "4321" : "1234"}" to authenticate.`
    );
  };

  const handleQuickAutoLogin = async (addr) => {
    const pass = targetPortal === "RTO" ? "4321" : "1234";
    setLoginAddress(addr);
    setLoginPassword(pass);
    await handleAddressPasswordLogin(null, addr, pass, targetPortal);
  };

  const handlePortalSwitch = (portal) => {
    setTargetPortal(portal);
    setLoginAddress("");
    setLoginPassword("");
    setLocalError("");
    setInfoNotice("");
    clearAuthError?.();
    if (isAuthenticated && sessionType !== portal) {
      logout();
    }
  };

  const activeError = localError || authError;
  const requiredPasswordHint = targetPortal === "RTO" ? "4321" : "1234";

  return (
    <div className="page-container" style={{ maxWidth: "620px", margin: "40px auto" }}>
      {/* Official Form Header Stamp */}
      <div className="official-docket-header">
        <div className="docket-stamp">
          <span className="stamp-sub">BHARAT MOTOR VEHICLES ACT</span>
          <span className="stamp-code">FORM 1-A • TITLE ACCESS GATEWAY</span>
        </div>
        <div className="docket-serial">SEC-AUTH-2026</div>
      </div>

      {/* Portal Mode Toggle: Citizen vs RTO */}
      <div className="portal-mode-toggle">
        <button
          type="button"
          className={`mode-toggle-btn ${targetPortal === "CITIZEN" ? "active citizen" : ""}`}
          onClick={() => handlePortalSwitch("CITIZEN")}
        >
          <User size={16} />
          <div className="mode-toggle-text">
            <span className="mode-title">Citizen Owner Access</span>
            <span className="mode-desc">Password: 1234</span>
          </div>
        </button>

        <button
          type="button"
          className={`mode-toggle-btn ${targetPortal === "RTO" ? "active rto" : ""}`}
          onClick={() => handlePortalSwitch("RTO")}
        >
          <Building2 size={16} />
          <div className="mode-toggle-text">
            <span className="mode-title">RTO Authority Terminal</span>
            <span className="mode-desc">Password: 4321</span>
          </div>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="card-box terminal-card" style={{ padding: "32px 30px" }}>
        <div className="terminal-header">
          <div className="terminal-icon-box">
            {targetPortal === "RTO" ? <Building2 size={24} className="text-blue" /> : <User size={24} className="text-saffron" />}
          </div>
          <div>
            <h1 className="terminal-title">
              {targetPortal === "RTO"
                ? "RTO Registrar & Title Officer Sign In"
                : "Citizen Digital RC Smart Card Sign In"}
            </h1>
            <p className="terminal-subtitle">
              {targetPortal === "RTO"
                ? "Authenticate as Regional Transport Authority to register vehicles, approve transfers, and issue scrappage certificates."
                : "Access your digital Registration Certificates, initiate ownership transfers, and submit scrappage requests."}
            </p>
          </div>
        </div>

        {infoNotice && !activeError && (
          <div className="status-banner notice" style={{ marginBottom: "18px" }}>
            <Sparkles size={15} />
            <span>{infoNotice}</span>
          </div>
        )}

        {activeError && (
          <div className="status-banner error" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <div>{activeError}</div>
          </div>
        )}

        {isAuthenticated && sessionType === targetPortal ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div className="session-active-card">
              <CheckCircle2 size={22} className="text-green" />
              <div>
                <div className="session-title">
                  Active {sessionType === "RTO" ? "RTO Authority" : "Citizen"} Session
                </div>
                <div className="session-address">{authenticatedAddress}</div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", padding: "9px 14px", fontSize: "12.5px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              onClick={() => navigate(isRtoOfficer ? "/rto" : "/user")}
            >
              <span>Go to {isRtoOfficer ? "RTO Portal" : "Citizen Portal"}</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%", padding: "10px", marginTop: "10px", fontSize: "13px" }}
              onClick={logout}
            >
              Sign Out of Session
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={handleAddressPasswordLogin}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className="input-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>
                      {targetPortal === "RTO" ? "RTO Authority Wallet Address" : "Citizen Owner Wallet Address"}
                    </label>
                    {loginAddress && (
                      <button
                        type="button"
                        onClick={() => setLoginAddress("")}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-dim)",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="input-with-icon">
                    <span className="input-affix">0x</span>
                    <input
                      type="text"
                      className="mono-input"
                      placeholder="Enter 42-character address or select below..."
                      value={loginAddress}
                      onChange={(e) => setLoginAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>
                      Password ({targetPortal === "RTO" ? "RTO: 4321" : "Citizen: 1234"})
                    </label>
                    <button
                      type="button"
                      className="chip-btn quick-pass-chip"
                      onClick={() => setLoginPassword(requiredPasswordHint)}
                    >
                      <Sparkles size={11} />
                      <span>Autofill ({requiredPasswordHint})</span>
                    </button>
                  </div>

                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="mono-input"
                      placeholder={`Enter password (${requiredPasswordHint})`}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      style={{ width: "100%", paddingRight: "70px", letterSpacing: "0.15em" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary ${targetPortal === "CITIZEN" ? "btn-saffron" : ""}`}
                  style={{ width: "100%", padding: "13px 18px", fontSize: "14px", fontWeight: "700", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                  disabled={isSubmitting || isAuthenticating}
                >
                  <Lock size={15} />
                  <span>
                    {isSubmitting || isAuthenticating
                      ? "Authenticating Credentials..."
                      : `Enter ${targetPortal === "RTO" ? "RTO Authority Terminal" : "Citizen Vehicle Portal"}`}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>

            {/* Quick Select Smart Identity Badges */}
            <div className="quick-accounts-section">
              <div className="quick-accounts-header">
                <span className="section-title">
                  {targetPortal === "RTO" ? "Designated RTO Authorities" : "Citizen Vehicle Owners"}
                </span>
                <span className="pass-hint">
                  Pass: <strong>{requiredPasswordHint}</strong>
                </span>
              </div>

              <div className="accounts-list">
                {(targetPortal === "RTO" ? authorityAccounts : citizenAccounts).map((acc) => {
                  const titleCount = getVehicleCount(acc.address);
                  const isSelected = loginAddress.toLowerCase() === acc.address.toLowerCase();

                  return (
                    <div
                      key={acc.address}
                      onClick={() => handleSelectAddress(acc.address)}
                      className={`account-smart-badge ${isSelected ? "selected" : ""}`}
                    >
                      <div className="badge-meta">
                        <div className="badge-top-row">
                          <span className="account-label">{acc.label}</span>
                          <span className={`role-chip ${acc.type === "AUTHORITY" ? "rto" : "citizen"}`}>
                            {acc.role}
                          </span>
                        </div>
                        <div className="account-address-row">
                          <code>{acc.address}</code>
                          {acc.type === "CITIZEN" && (
                            <span className="count-pill">
                              • {titleCount} vehicle{titleCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="badge-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-secondary fill-btn"
                          onClick={() => handleSelectAddress(acc.address)}
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          className="btn-primary auto-login-btn"
                          disabled={isSubmitting}
                          onClick={() => handleQuickAutoLogin(acc.address)}
                        >
                          Login ({requiredPasswordHint}) →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
