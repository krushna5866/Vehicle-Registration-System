import React, { useState } from "react";
import {
  Printer,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
  ExternalLink,
  QrCode,
  Building2,
  Calendar,
  Hash,
  Cpu,
  Car
} from "lucide-react";
import HSRPPlate from "./HSRPPlate";
import { maskAddress, STATE_SERIES } from "../constants/vehicleConstants";

function getRtoAuthorityName(plate = "") {
  const clean = plate.toUpperCase().trim();
  if (clean.includes("BH")) {
    return "Bharat Series National Registry • MoRTH New Delhi";
  }
  const prefix = clean.slice(0, 2);
  const matched = STATE_SERIES.find((s) => s.code === prefix);
  const codeDigits = clean.slice(3, 5);
  const rtoNum = codeDigits && !isNaN(codeDigits) ? `RTO-${codeDigits}` : "Central RTO";
  return matched
    ? `${rtoNum} (${matched.name}) • Motor Vehicles Department`
    : "Regional Transport Office (RTO) • Motor Vehicles Department";
}

function getOwnerSerial(historyLength = 1) {
  if (historyLength <= 1) return "1st Owner (Original Registrant)";
  if (historyLength === 2) return "2nd Owner (Transferred via RTO)";
  if (historyLength === 3) return "3rd Owner (Transferred via RTO)";
  return `${historyLength}th Owner (Transferred via RTO)`;
}

export default function DigitalRcModal({ vehicle, isOpen, onClose }) {
  const [showFullVin, setShowFullVin] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vehicle) return null;

  const isScrapped = vehicle.state === 1;
  const regDate = new Date(vehicle.registeredAt * 1000);
  const expiryDate = new Date(regDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 15);

  const ownerSerialText = getOwnerSerial(vehicle.history?.length || 1);
  const rtoAuthority = getRtoAuthorityName(vehicle.regNumber);
  const isElectric =
    (vehicle.model || "").toUpperCase().includes("EV") ||
    (vehicle.make || "").toUpperCase().includes("EV");

  const fullChassisVin =
    vehicle.vin ||
    (vehicle.vinMasked && !vehicle.vinMasked.includes("...")
      ? vehicle.vinMasked
      : `MAT${vehicle.vehicleId.slice(2, 10).toUpperCase()}01234`.slice(0, 17));

  const engineNumber = isElectric
    ? `MOTOR-${vehicle.vehicleId.slice(2, 8).toUpperCase()}-KW`
    : `ENG-${vehicle.vehicleId.slice(2, 8).toUpperCase()}-BS6`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDetails = () => {
    const text = `REGISTRATION CERTIFICATE (FORM 23)
Plate: ${vehicle.regNumber}
Make & Model: ${vehicle.make} ${vehicle.model} (${vehicle.year})
Owner Wallet: ${vehicle.titleHolder}
Owner Serial: ${ownerSerialText}
Chassis VIN: ${fullChassisVin}
Registering Authority: ${rtoAuthority}
Registration Date: ${regDate.toLocaleDateString("en-US")}
RC Status: ${isScrapped ? "DECOMMISSIONED (SCRAPPED)" : "ACTIVE & REGISTERED"}
Token ID: ${vehicle.vehicleId}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay rc-view-modal-overlay" onClick={onClose}>
      <div
        className="modal-content rc-view-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Action Bar */}
        <div className="rc-modal-action-bar no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={16} className="text-saffron" />
            <span className="rc-modal-bar-title">Digital Registration Certificate (Form 23)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="btn-secondary rc-action-btn"
              onClick={handleCopyDetails}
              title="Copy RC Details to clipboard"
            >
              {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy Info"}</span>
            </button>

            <button
              type="button"
              className="btn-primary rc-action-btn"
              onClick={handlePrint}
              style={{ background: "#2563eb" }}
              title="Print or Save Official Form 23 as PDF"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close Certificate Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL CERTIFICATE CONTAINER */}
        <div className="printable-rc-certificate" id="official-rc-document">
          {/* Top Indian Tricolor Band */}
          <div className="rc-doc-tricolor"></div>

          {/* Official Document Header */}
          <div className="rc-doc-header">
            <div className="rc-header-crest">
              <svg viewBox="0 0 36 36" className="emblem-svg" fill="none">
                <circle cx="18" cy="18" r="16.5" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 1.5" />
                <circle cx="18" cy="18" r="14.5" stroke="#1e40af" strokeWidth="1" />
                <circle cx="18" cy="18" r="4" fill="#1e40af" stroke="#f59e0b" strokeWidth="1" />
                {[...Array(24)].map((_, i) => (
                  <line
                    key={i}
                    x1="18"
                    y1="4.5"
                    x2="18"
                    y2="31.5"
                    stroke="#3b82f6"
                    strokeWidth="0.75"
                    transform={`rotate(${i * 15} 18 18)`}
                  />
                ))}
              </svg>
            </div>

            <div className="rc-header-text">
              <div className="rc-header-gov">GOVERNMENT OF INDIA • MINISTRY OF ROAD TRANSPORT & HIGHWAYS</div>
              <h2 className="rc-header-form">FORM 23</h2>
              <div className="rc-header-rule">[See Rule 48 of Central Motor Vehicles Rules, 1989]</div>
              <h1 className="rc-header-title">CERTIFICATE OF REGISTRATION</h1>
              <div className="rc-header-auth">{rtoAuthority}</div>
            </div>

            {/* Smartcard EMV Microchip & Hologram */}
            <div className="rc-header-chip-box">
              <div className="emv-gold-chip" title="Cryptographic EMV Smartcard Chip">
                <div className="chip-trace t1"></div>
                <div className="chip-trace t2"></div>
                <div className="chip-trace t3"></div>
                <div className="chip-center"></div>
              </div>
              <span className="chip-sub-label">SECURE SMARTCARD</span>
            </div>
          </div>

          {/* Irrevocable Scrappage Rubber Stamp Overlay */}
          {isScrapped && (
            <div className="rc-doc-rubber-stamp">
              <div className="rc-rubber-stamp-inner">
                <div className="rc-stamp-title">★ REGISTRATION CANCELLED - SCRAPPED ★</div>
                <div className="rc-stamp-sub">DECOMMISSIONED UNDER SECTION 55 OF MOTOR VEHICLES ACT 1988</div>
                <div className="rc-stamp-meta">
                  REASON: {(vehicle.scrapReason || "End-of-Life Vehicle Scrappage").toUpperCase()} • VEHICLE CONDEMNED
                </div>
              </div>
            </div>
          )}

          {/* Plate & Verification QR Hero Strip */}
          <div className="rc-doc-hero-strip">
            <div className="rc-doc-plate-cell">
              <HSRPPlate plate={vehicle.regNumber} size="large" />
            </div>

            <div className="rc-doc-status-cell">
              <div className="rc-status-title">REGISTRATION STATUS</div>
              {isScrapped ? (
                <div className="rc-status-badge scrapped">
                  <span>🚫 DECOMMISSIONED & SCRAPPED</span>
                </div>
              ) : (
                <div className="rc-status-badge active">
                  <span className="live-dot"></span>
                  <span>ACTIVE & VALID TITLE</span>
                </div>
              )}
              <div className="rc-status-sub">
                Life Time Tax (LTT): <strong>PAID</strong> • Fitness: <strong>VALID</strong>
              </div>
            </div>

            {/* Verifiable QR Code Block */}
            <div className="rc-doc-qr-cell" title="Scan to verify cryptographic title">
              <div className="rc-qr-graphic">
                <svg viewBox="0 0 100 100" className="qr-svg-graphic">
                  {/* Outer Frame */}
                  <rect x="5" y="5" width="90" height="90" fill="#ffffff" rx="4" />
                  {/* Corner Targets */}
                  <rect x="12" y="12" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="16" y="16" width="16" height="16" fill="#ffffff" rx="1" />
                  <rect x="20" y="20" width="8" height="8" fill="#0f172a" />

                  <rect x="64" y="12" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="68" y="16" width="16" height="16" fill="#ffffff" rx="1" />
                  <rect x="72" y="20" width="8" height="8" fill="#0f172a" />

                  <rect x="12" y="64" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="16" y="68" width="16" height="16" fill="#ffffff" rx="1" />
                  <rect x="20" y="72" width="8" height="8" fill="#0f172a" />

                  {/* Data Dots Pattern */}
                  <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="14" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="24" width="6" height="6" fill="#0f172a" />
                  
                  <rect x="44" y="44" width="12" height="12" fill="#2563eb" rx="2" />
                  <circle cx="50" cy="50" r="3" fill="#ffffff" />

                  <rect x="64" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="64" y="52" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="52" width="6" height="6" fill="#0f172a" />

                  <rect x="42" y="64" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="64" width="6" height="6" fill="#0f172a" />
                  <rect x="64" y="64" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="74" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="84" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="84" width="16" height="6" fill="#0f172a" />
                </svg>
              </div>
              <span className="rc-qr-label">LEDGER PROOF</span>
            </div>
          </div>

          {/* Regulatory Data Tables Grid */}
          <div className="rc-data-sections-grid">
            {/* SECTION 1: REGISTRATION & VALIDITY */}
            <div className="rc-data-section">
              <div className="rc-section-header">
                <span className="rc-section-num">I</span>
                <span className="rc-section-title">REGISTRATION & JURISDICTION</span>
              </div>
              <div className="rc-key-val-table">
                <div className="rc-row">
                  <span className="rc-key">Registration Number:</span>
                  <span className="rc-val mono strong">{vehicle.regNumber}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Date of Registration:</span>
                  <span className="rc-val">{regDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Registration Valid Upto:</span>
                  <span className="rc-val strong">{expiryDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Registering Authority (RTO):</span>
                  <span className="rc-val">{rtoAuthority}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Tax Status:</span>
                  <span className="rc-val text-green">One-Time LTT Paid (Life Time Tax)</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: OWNER PARTICULARS */}
            <div className="rc-data-section">
              <div className="rc-section-header">
                <span className="rc-section-num">II</span>
                <span className="rc-section-title">REGISTERED OWNER PARTICULARS</span>
              </div>
              <div className="rc-key-val-table">
                <div className="rc-row">
                  <span className="rc-key">Owner Titleholder:</span>
                  <span className="rc-val mono strong">{vehicle.titleHolder}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Ownership Serial:</span>
                  <span className="rc-val text-saffron strong">{ownerSerialText}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Hypothecation / Lien:</span>
                  <span className="rc-val text-green">NONE (Unencumbered Cryptographic Title)</span>
                </div>
                {vehicle.previousOwner && (
                  <div className="rc-row">
                    <span className="rc-key">Transferred From (Old Owner):</span>
                    <span className="rc-val mono" style={{ color: "#93c5fd" }}>{maskAddress(vehicle.previousOwner)}</span>
                  </div>
                )}
                {vehicle.pendingTransferTo && (
                  <div className="rc-row">
                    <span className="rc-key">Pending Transfer to Buyer:</span>
                    <span className="rc-val mono text-saffron">{maskAddress(vehicle.pendingTransferTo)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: VEHICLE SPECIFICATIONS */}
            <div className="rc-data-section">
              <div className="rc-section-header">
                <span className="rc-section-num">III</span>
                <span className="rc-section-title">VEHICLE SPECIFICATION & TECHNICAL PARTICULARS</span>
              </div>
              <div className="rc-key-val-table">
                <div className="rc-row">
                  <span className="rc-key">Maker's Name (Manufacturer):</span>
                  <span className="rc-val strong">{vehicle.make}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Commercial Model:</span>
                  <span className="rc-val strong">{vehicle.model}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Class of Vehicle:</span>
                  <span className="rc-val">MOTOR CAR (LMV - LIGHT MOTOR VEHICLE)</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Fuel / Energy Source:</span>
                  <span className="rc-val">{isElectric ? "ELECTRIC (ZERO EMISSION EV)" : "PETROL / HYBRID"}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Chassis Number / VIN:</span>
                  <div className="rc-val-vin-group">
                    <span className="rc-val mono strong">
                      {showFullVin ? fullChassisVin : vehicle.vinMasked || `${fullChassisVin.slice(0, 3)}...${fullChassisVin.slice(-4)}`}
                    </span>
                    <button
                      type="button"
                      className="rc-vin-toggle-btn no-print"
                      onClick={() => setShowFullVin(!showFullVin)}
                      title={showFullVin ? "Mask sensitive Chassis VIN" : "Reveal full 17-character Chassis VIN"}
                    >
                      {showFullVin ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{showFullVin ? "Mask" : "Reveal"}</span>
                    </button>
                  </div>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Engine / Motor Serial:</span>
                  <span className="rc-val mono">{engineNumber}</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Seating Capacity:</span>
                  <span className="rc-val">5 in all (including driver)</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Emission Compliance:</span>
                  <span className="rc-val">{isElectric ? "BHARAT STAGE VI (ZERO EMISSION)" : "BHARAT STAGE VI (BS-VI)"}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: CRYPTOGRAPHIC ANCHOR & BLOCKCHAIN PROOF */}
            <div className="rc-data-section">
              <div className="rc-section-header">
                <span className="rc-section-num">IV</span>
                <span className="rc-section-title">CRYPTOGRAPHIC BLOCKCHAIN PROOF</span>
              </div>
              <div className="rc-key-val-table">
                <div className="rc-row">
                  <span className="rc-key">ERC-721 Token ID (Chassis Hash):</span>
                  <span className="rc-val mono" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                    {vehicle.vehicleId}
                  </span>
                </div>
                {vehicle.metadataHash && (
                  <div className="rc-row">
                    <span className="rc-key">Off-Chain Metadata Commitment:</span>
                    <span className="rc-val mono" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                      {vehicle.metadataHash}
                    </span>
                  </div>
                )}
                <div className="rc-row">
                  <span className="rc-key">Registering Officer Signer:</span>
                  <span className="rc-val mono">
                    {vehicle.registeredByRto ? vehicle.registeredByRto : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (RTO Registrar)"}
                  </span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">Consensus Network:</span>
                  <span className="rc-val">HARDHAT LOCALHOST (CHAIN ID: 31337) • SECURE DISTRIBUTED LEDGER</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Security Watermark Footer */}
          <div className="rc-doc-footer">
            <div className="rc-footer-signature">
              <div className="rc-signature-line"></div>
              <div className="rc-signature-title">Digitally Signed & Sealed by RTO Authority</div>
              <div className="rc-signature-sub">Motor Vehicles Department, Government of India</div>
            </div>

            <div className="rc-footer-note">
              This document is a legally valid digital Certificate of Registration issued under Section 41 of the Motor Vehicles Act 1988 read with the Information Technology Act 2000. Verified via decentralized cryptographic consensus.
            </div>
          </div>
        </div>

        {/* Bottom Modal Close */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", justifyContent: "flex-end", gap: "10px" }} className="no-print">
          <button className="btn-secondary" onClick={onClose} style={{ padding: "8px 16px" }}>
            Close Certificate
          </button>
          <button className="btn-primary" onClick={handlePrint} style={{ padding: "8px 16px" }}>
            <Printer size={14} style={{ marginRight: "6px" }} />
            <span>Print Form 23 Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
