import React, { useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { maskAddress } from "../constants/vehicleConstants";
import WalletModal from "./WalletModal";

export function CitizenGuard({ children }) {
  const { isAuthenticated, sessionType, authenticatedAddress, logout } = useAuth();
  const location = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, targetPortal: "CITIZEN" }} replace />;
  }

  if (sessionType !== "CITIZEN") {
    return (
      <div className="page-container" style={{ maxWidth: "600px", margin: "60px auto" }}>
        <div className="card-box" style={{ textAlign: "center", padding: "40px 30px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👤</div>
          <h2 style={{ margin: "0 0 10px", fontSize: "20px" }}>
            Citizen Login Required (Password: 1234)
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
            You are currently logged in as <strong>RTO</strong> (<code>{maskAddress(authenticatedAddress)}</code>). Switch to a Citizen account (Password: <code>1234</code>) to view Citizen vehicle registrations.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsWalletModalOpen(true)}
            >
              🔄 Switch to Citizen Account (1234)
            </button>
            <Link
              to="/rto"
              className="btn-secondary"
              style={{ textDecoration: "none", fontSize: "12px", padding: "6px 12px" }}
            >
              Go to RTO Portal →
            </Link>
            <button type="button" className="btn-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
      </div>
    );
  }

  return children;
}

export function RtoGuard({ children }) {
  const { isAuthenticated, sessionType, authenticatedAddress, logout } = useAuth();
  const location = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, targetPortal: "RTO" }} replace />;
  }

  if (sessionType !== "RTO") {
    return (
      <div className="page-container" style={{ maxWidth: "600px", margin: "60px auto" }}>
        <div className="card-box" style={{ textAlign: "center", padding: "40px 30px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏢</div>
          <h2 style={{ margin: "0 0 10px", fontSize: "20px" }}>
            RTO Login Required (Password: 4321)
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
            You are currently logged in as <strong>Citizen</strong> (<code>{maskAddress(authenticatedAddress)}</code>). Switch to the RTO account (Password: <code>4321</code>) to register new vehicles.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsWalletModalOpen(true)}
            >
              🔄 Switch to RTO Account (4321)
            </button>
            <Link
              to="/user"
              className="btn-secondary"
              style={{ textDecoration: "none", fontSize: "12px", padding: "6px 12px" }}
            >
              Go to Citizen Portal →
            </Link>
            <button type="button" className="btn-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
      </div>
    );
  }

  return children;
}

export default function ProtectedRoute({ children, requiredRole }) {
  if (requiredRole === "RTO_OFFICER") {
    return <RtoGuard>{children}</RtoGuard>;
  }
  return <CitizenGuard>{children}</CitizenGuard>;
}
