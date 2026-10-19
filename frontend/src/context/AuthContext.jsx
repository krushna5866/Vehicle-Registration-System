import React, { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authenticatedAddress, setAuthenticatedAddress] = useState(null);
  const [sessionType, setSessionType] = useState(null); // 'CITIZEN' | 'RTO' | null
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Direct Authentication for a Wallet Address and Target Role ('CITIZEN' | 'RTO')
   */
  const authenticateAsAddress = async (address, _contract, targetPortal = "CITIZEN") => {
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const rawAddr = (address || "").trim();
      if (!rawAddr || !ethers.isAddress(rawAddr)) {
        throw new Error("Please enter a valid 42-character Ethereum wallet address (0x...).");
      }

      const cleanAddress = ethers.getAddress(rawAddr);
      const normalizedPortal = targetPortal === "RTO" ? "RTO" : "CITIZEN";

      setAuthenticatedAddress(cleanAddress);
      setSessionType(normalizedPortal);
      setAuthError("");

      return {
        success: true,
        address: cleanAddress,
        sessionType: normalizedPortal
      };
    } catch (err) {
      const msg = err.message || "Failed to authenticate account.";
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Address + Password Portal Authentication
   * - Citizen Portal password: "1234"
   * - RTO Portal password: "4321"
   */
  const loginWithAddressAndPassword = async (address, password, contract, targetPortal = "CITIZEN") => {
    setAuthError("");
    const rawAddr = (address || "").trim();
    const rawPass = String(password || "").trim();

    if (!rawAddr || !ethers.isAddress(rawAddr)) {
      const msg = "Please enter a valid 42-character Wallet Address (0x...).";
      setAuthError(msg);
      return { success: false, error: msg };
    }

    const expectedPassword = targetPortal === "RTO" ? "4321" : "1234";
    if (rawPass !== expectedPassword) {
      const msg =
        targetPortal === "RTO"
          ? "Incorrect password for RTO Portal. Please use password: 4321"
          : "Incorrect password for Citizen Portal. Please use password: 1234";
      setAuthError(msg);
      return { success: false, error: msg };
    }

    return await authenticateAsAddress(rawAddr, contract, targetPortal);
  };

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const logout = () => {
    setAuthenticatedAddress(null);
    setSessionType(null);
    setAuthError("");
  };

  return (
    <AuthContext.Provider
      value={{
        authenticatedAddress,
        sessionType,
        isRtoAuthorized: sessionType === "RTO",
        isCitizenAuthorized: sessionType === "CITIZEN",
        isRtoRegistrar: sessionType === "RTO",
        isRtoOfficer: sessionType === "RTO",
        isCitizen: sessionType === "CITIZEN",
        isAuthenticated: Boolean(authenticatedAddress),
        isAuthenticating,
        authError,
        clearAuthError,
        authenticateAsAddress,
        loginWithAddressAndPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
