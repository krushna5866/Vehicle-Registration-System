import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BlockchainProvider } from "./context/BlockchainContext";
import Navbar from "./components/Navbar";
import ProtectedRoute, { CitizenGuard, RtoGuard } from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RtoPortalPage from "./pages/RtoPortalPage";
import CitizenPortalPage from "./pages/CitizenPortalPage";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <HashRouter>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Home & Vehicle Search */}
                <Route path="/" element={<HomePage />} />

                {/* Login Page */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected RTO Portal (Officer Only) */}
                <Route
                  path="/rto"
                  element={
                    <RtoGuard>
                      <RtoPortalPage />
                    </RtoGuard>
                  }
                />

                {/* Protected User Portal (Vehicle Owners) */}
                <Route
                  path="/user"
                  element={
                    <CitizenGuard>
                      <CitizenPortalPage />
                    </CitizenGuard>
                  }
                />
                <Route
                  path="/citizen"
                  element={
                    <CitizenGuard>
                      <CitizenPortalPage />
                    </CitizenGuard>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="gov-footer">
              <div className="footer-wrap">
                <div>
                  <strong>Vehicle Registration System</strong> • Blockchain Ledger
                  <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-dim)" }}>
                    Immutable Title & Ownership Management
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-dim)" }}>
                  Smart Contract Verified • ERC-721 Digital Title
                </div>
              </div>
            </footer>
          </div>
        </HashRouter>
      </BlockchainProvider>
    </AuthProvider>
  );
}
