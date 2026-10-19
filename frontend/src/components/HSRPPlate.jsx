import React from "react";

export default function HSRPPlate({ plate, size = "normal" }) {
  const cleanPlate = (plate || "MH 12 AB 0000").toUpperCase();

  return (
    <div className={`hsrp-plate ${size === "large" ? "large" : ""} ${size === "small" ? "small" : ""}`}>
      {/* Left Chrome Rivet Bolt */}
      <div className="hsrp-rivet left" title="Security Snap-Lock Rivet">
        <div className="rivet-head">
          <div className="rivet-slot"></div>
        </div>
      </div>

      {/* IND Blue Hologram Security Strip */}
      <div className="hsrp-strip">
        <div className="hsrp-chakra-wrap">
          {/* Detailed 24-spoke Ashoka Chakra vector SVG */}
          <svg viewBox="0 0 24 24" className="hsrp-chakra-svg" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="1.8" stroke="#3b82f6" />
            <circle cx="12" cy="12" r="2.5" fill="#3b82f6" />
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="12"
                y1="2"
                x2="12"
                y2="22"
                stroke="#3b82f6"
                strokeWidth="0.9"
                transform={`rotate(${i * 30} 12 12)`}
              />
            ))}
          </svg>
        </div>
        <span className="hsrp-ind">IND</span>
        <div className="hsrp-micro-code">HSRP</div>
      </div>

      {/* 3D Embossed Plate Alphanumerics */}
      <div className="hsrp-number">{cleanPlate}</div>

      {/* Right Chrome Rivet Bolt */}
      <div className="hsrp-rivet right" title="Security Snap-Lock Rivet">
        <div className="rivet-head">
          <div className="rivet-slot"></div>
        </div>
      </div>
    </div>
  );
}
