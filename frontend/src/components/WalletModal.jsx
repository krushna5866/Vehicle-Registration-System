import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  User,
  Building2,
  Lock,
  LogOut,
  X,
  CheckCircle2,
  KeyRound,
  Shield
} from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { useAuth } from "../context/AuthContext";
import { maskAddress } from "../constants/vehicleConstants";

export default function WalletModal({ isOpen, onClose }) {
  const { selectLocalAccount, readContract, knownWallets, vehicles } = useBlockchain();
  const {
    authenticatedAddress,
    isRtoOfficer,
    authenticateAsAddress,
    loginWithAddressAndPassword,
    logout
  } = useAuth();
  const navigate = useNavigate();

  const [loadingAccount, setLoadingAccount] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualPassword, setManualPassword] = useState("");

  if (!isOpen) return null;

  const citizenAccounts = (knownWallets || []).filter((w) => w.type === "CITIZEN");
  const authorityAccounts = (knownWallets || []).filter((w) => w.type === "AUTHORITY");

  const getVehicleCount = (addr) => {
    return vehicles.filter((v) => v.titleHolder?.toLowerCase() === addr.toLowerCase()).length;
  };

  const handleSelectAccount = async (targetAddress, targetType) => {
    setErrorMsg("");
    setLoadingAccount(targetAddress);

    try {
      logout();
      const res = await selectLocalAccount(targetAddress);
      const portalForAccount = targetType === "AUTHORITY" ? "RTO" : "CITIZEN";
      const authRes = await authenticateAsAddress(targetAddress, readContract || res?.contract, portalForAccount);
      if (!authRes.success) {
        throw new Error(authRes.error || "Authentication failed.");
      }

      onClose();
      navigate(authRes.sessionType === "RTO" ? "/rto" : "/user");
    } catch (err) {
      setErrorMsg(err.message || "Failed to switch account.");
    } finally {
      setLoadingAccount(null);
    }
  };

  const handleManualAddressPasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const addr = manualAddress.trim();
    const pass = manualPassword.trim();
    if (!addr) {
      setErrorMsg("Please enter a wallet address (0x...).");
      return;
    }
    if (pass !== "1234" && pass !== "4321") {
      setErrorMsg("Invalid password. Enter 1234 for Citizen or 4321 for RTO.");
      return;
    }

    const targetPortal = pass === "4321" ? "RTO" : "CITIZEN";
    setLoadingAccount("manual");

    try {
      logout();
      const res = await selectLocalAccount(addr);
      const authRes = await loginWithAddressAndPassword(addr, pass, readContract || res?.contract, targetPortal);

      if (!authRes.success) {
        throw new Error(authRes.error || "Authentication failed.");
      }

      onClose();
      navigate(authRes.sessionType === "RTO" ? "/rto" : "/user");
    } catch (err) {
      setErrorMsg(err.message || "Login failed.");
    } finally {
      setLoadingAccount(null);
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "580px", padding: "26px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-category-tag">IDENTITY MANAGEMENT</div>
            <h3 style={{ fontSize: "18px", margin: "2px 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw size={17} className="text-blue" />
              <span>Switch Cryptographic Identity</span>
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
              Citizen Password: <code>1234</code> • RTO Password: <code>4321</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="status-banner error" style={{ marginBottom: "16px", fontSize: "12px" }}>
            <span>{errorMsg}</span>
          </div>
        )}

        {authenticatedAddress && (
          <div className="active-wallet-box">
            <div>
              <div className="active-wallet-tag">CURRENT ACTIVE WALLET</div>
              <div className="active-wallet-addr">{authenticatedAddress}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`user-role-chip ${isRtoOfficer ? "officer" : "citizen"}`}>
                {isRtoOfficer ? "RTO Authority" : "Citizen"}
              </span>
              <button
                type="button"
                className="logout-btn"
                onClick={handleSignOut}
                title="Sign out of current wallet"
              >
                <LogOut size={12} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        )}

        {/* Direct Address + Password Entry */}
        <form
          onSubmit={handleManualAddressPasswordLogin}
          className="manual-auth-box"
        >
          <input
            type="text"
            className="mono-input"
            placeholder="0x... Any Wallet Address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            style={{ flex: "2 1 210px", fontSize: "12px", padding: "9px 12px" }}
          />
          <input
            type="password"
            className="mono-input"
            placeholder="Pass (1234/4321)"
            value={manualPassword}
            onChange={(e) => setManualPassword(e.target.value)}
            style={{ flex: "1 1 120px", fontSize: "12px", padding: "9px 12px" }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loadingAccount === "manual"}
            style={{ padding: "9px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <KeyRound size={13} />
            <span>{loadingAccount === "manual" ? "Signing..." : "Login"}</span>
          </button>
        </form>

        {/* Citizen Accounts Docket */}
        <div style={{ marginBottom: "18px" }}>
          <div className="accounts-group-header">
            <User size={13} className="text-saffron" />
            <span>Citizen Owners (Password: 1234)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {citizenAccounts.map((acc) => {
              const isCurrent = authenticatedAddress && authenticatedAddress.toLowerCase() === acc.address.toLowerCase();
              const titleCount = getVehicleCount(acc.address);

              return (
                <div
                  key={acc.address}
                  onClick={() => !isCurrent && handleSelectAccount(acc.address, "CITIZEN")}
                  className={`modal-account-badge ${isCurrent ? "current citizen" : ""}`}
                >
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)" }}>
                      {acc.label}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {maskAddress(acc.address)} • Pass: <code>1234</code> • {titleCount} vehicle(s)
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="badge-active-tag">
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: "5px 11px", fontSize: "11px", borderRadius: "5px", background: "#f97316" }}
                        disabled={loadingAccount === acc.address}
                      >
                        Login (1234) →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RTO Authority Account Docket */}
        <div>
          <div className="accounts-group-header">
            <Building2 size={13} className="text-blue" />
            <span>RTO Authority (Password: 4321)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {authorityAccounts.map((acc) => {
              const isCurrent = authenticatedAddress && authenticatedAddress.toLowerCase() === acc.address.toLowerCase();

              return (
                <div
                  key={acc.address}
                  onClick={() => !isCurrent && handleSelectAccount(acc.address, "AUTHORITY")}
                  className={`modal-account-badge ${isCurrent ? "current rto" : ""}`}
                >
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main)" }}>
                      {acc.label}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {maskAddress(acc.address)} • Pass: <code>4321</code>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="badge-active-tag">
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: "5px 11px", fontSize: "11px", borderRadius: "5px" }}
                        disabled={loadingAccount === acc.address}
                      >
                        Login (4321) →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
