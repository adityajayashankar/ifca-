import React, { useState } from "react";

const PLANETS = [
  // name, color, orbit radius (px), size (px), initial angle (deg), glow color, orbit duration (s)
  { name: "Mercury", color: "#a08c6d", orbit: 130, size: 8, angle: 205, glow: "#a08c6d", duration: 6 },
  { name: "Venus", color: "#b6a13a", orbit: 160, size: 13, angle: 150, glow: "#b6a13a", duration: 10 },
  { name: "Earth", color: "#5ad1e6", orbit: 200, size: 28, angle: 225, glow: "#5ad1e6", duration: 14 },
  { name: "Mars", color: "#c44b3c", orbit: 240, size: 10, angle: 340, glow: "#c44b3c", duration: 18 },
  { name: "Jupiter", color: "#e6a84a", orbit: 280, size: 32, angle: 260, glow: "#e6a84a", duration: 22 },
  { name: "Saturn", color: "#bfae7c", orbit: 320, size: 22, angle: 320, glow: "#bfae7c", duration: 26 },
  { name: "Uranus", color: "#7cd1e6", orbit: 360, size: 14, angle: 140, glow: "#7cd1e6", duration: 30 },
  { name: "Neptune", color: "#7c5abf", orbit: 400, size: 22, angle: 30, glow: "#7c5abf", duration: 34 },
];

const ORBITS = [130, 160, 200, 240, 280, 320, 360, 400];

const SolarSystemStatic = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const size = 800; // SVG size
  const center = size / 2;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #181b2c 0%, #0a0b13 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* NAVIGATION BAR */}
      <nav style={{
        position: "absolute",
        top: 32,
        left: "50%",
        transform: "translateX(-50%)",
        width: 640,
        maxWidth: "90vw",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(8px)",
        borderRadius: 32,
        padding: "0.5rem 2rem",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/homelogo.png" alt="Jyotirgamaya Logo" style={{ height: 28, width: 28, marginRight: 8 }} />
          <span style={{ fontWeight: 600, fontSize: 18, color: "#222" }}>Jyotirgamaya</span>
        </div>
        {/* Desktop Nav Links */}
        <div className="nav-links" style={{ display: "flex", gap: 12 }}>
          <a href="#" style={{ color: "#222", fontWeight: 500, fontSize: 15, padding: "6px 18px", borderRadius: 20, background: "#fff", textDecoration: "none" }}>Home</a>
          <a href="/login" style={{ color: "#fff", fontWeight: 500, fontSize: 15, padding: "6px 18px", borderRadius: 20, background: "#ff6f3c", textDecoration: "none" }}>Web App</a>
          <a href="#" style={{ color: "#222", fontWeight: 500, fontSize: 15, padding: "6px 18px", borderRadius: 20, background: "#fff", textDecoration: "none" }}>About</a>
        </div>
        {/* Hamburger for mobile */}
        <button
          className="hamburger"
          style={{
            display: "none",
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
            padding: 8,
            marginLeft: 8,
          }}
          aria-label="Open menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span style={{ fontSize: 28, color: "#fff", fontWeight: 700 }}>&#9776;</span>
        </button>
        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div
            className="mobile-menu"
            style={{
              position: "absolute",
              top: 56,
              right: 16,
              minWidth: 160,
              background: "rgba(30,32,40,0.95)",
              borderRadius: 16,
              boxShadow: "0 2px 24px 0 #0006",
              padding: "16px 0",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              zIndex: 100,
              alignItems: "flex-end",
            }}
          >
            <a href="#" style={{ color: "#fff", fontWeight: 500, fontSize: 16, padding: "10px 24px", borderRadius: 10, textDecoration: "none", width: "100%", textAlign: "right" }}>Home</a>
            <a href="/login" style={{ color: "#fff", fontWeight: 500, fontSize: 16, padding: "10px 24px", borderRadius: 10, textDecoration: "none", width: "100%", textAlign: "right", background: "#ff6f3c", margin: "2px 0" }}>Web App</a>
            <a href="#" style={{ color: "#fff", fontWeight: 500, fontSize: 16, padding: "10px 24px", borderRadius: 10, textDecoration: "none", width: "100%", textAlign: "right" }}>About</a>
          </div>
        )}
      </nav>

      {/* MAIN HEADINGS & CTA */}
      <div style={{
        position: "absolute",
        top: 120,
        left: "50%",
        transform: "translateX(-50%)",
        width: 700,
        maxWidth: "95vw",
        zIndex: 10,
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 12,
          letterSpacing: -1,
          lineHeight: 1.1,
          textShadow: "0 2px 16px #0008"
        }}>
          Transforming<br />Astrology with Technology
        </h1>
        <div style={{ color: "#fff", opacity: 0.8, fontSize: 16, marginBottom: 28 }}>
          Combining ancient wisdom with cutting-edge technology to deliver accurate predictions<br />for users and empower astrologers.
        </div>
        <a href="/login" style={{
          display: "inline-block",
          background: "rgba(40, 40, 60, 0.55)",
          color: "#fff",
          fontWeight: 500,
          fontSize: 16,
          borderRadius: 10,
          padding: "12px 32px",
          border: "1.5px solid rgba(255,255,255,0.13)",
          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.18)",
          textDecoration: "none",
          marginBottom: 32,
          transition: "background 0.2s, color 0.2s"
        }}>Explore the WEB APP</a>
        <div style={{ marginTop: 16 }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" style={{ display: "inline-block" }}>
            <circle cx="19" cy="19" r="18" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M19 12V26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M13 20L19 26L25 20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* GLASS INFO CARD BOTTOM LEFT */}
      <div style={{
        position: "absolute",
        left: 40,
        bottom: 40,
        zIndex: 10,
        background: "rgba(30,32,40,0.7)",
        borderRadius: 18,
        padding: "28px 32px 24px 32px",
        maxWidth: 420,
        boxShadow: "0 2px 24px 0 #0006",
        backdropFilter: "blur(8px)",
        color: "#fff"
      }}>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 10, letterSpacing: -0.5 }}>
          Astrology Meets<br />DeepTech
            </div>
        <div style={{ fontSize: 15, color: "#fff", opacity: 0.85, lineHeight: 1.6 }}>
          At <b>Jyotirgamaya</b>, we use advanced mathematical models and deeptech algorithms to calculate precise planetary positions. By analyzing user details such as date, time, and place of birth, we provide accurate predictions tailored to individual needs.
        </div>
      </div>

      {/* SVG for orbits and planets */}
      <svg width={size} height={size} style={{ display: "block", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
        {/* Orbits */}
        {ORBITS.map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.09}
            strokeWidth={1}
          />
        ))}
        {/* Planets (animated) */}
        {PLANETS.map((p, i) => {
          // Each planet is in a group that rotates around the center
          return (
            <g
              key={p.name}
              style={{
                transformOrigin: `${center}px ${center}px`,
                animation: `orbit-planet-${i} ${p.duration}s linear infinite`,
                transform: `rotate(${p.angle}deg)`
              }}
            >
              {/* Glow */}
              <circle
                cx={center + p.orbit}
                cy={center}
                r={p.size / 2 + 8}
                fill={p.glow}
                fillOpacity={0.18}
                style={{ filter: `blur(6px)` }}
              />
              {/* Planet */}
              <circle
                cx={center + p.orbit}
                cy={center}
                r={p.size / 2}
                fill={p.color}
                stroke="#fff"
                strokeOpacity={0.13}
                strokeWidth={1}
              />
            </g>
          );
        })}
        {/* Sun Glow */}
        <circle
          cx={center}
          cy={center}
          r={38}
          fill="#ffb86b"
          fillOpacity={0.18}
          style={{ filter: "blur(16px)" }}
        />
        {/* Sun */}
        <circle
          cx={center}
          cy={center}
          r={18}
          fill="#ffb86b"
          stroke="#fff6e0"
          strokeWidth={2}
        />
      </svg>
      {/* Foreground stars (random dots) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[...Array(80)].map((_, i) => {
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const size = Math.random() * 1.5 + 0.5;
          const opacity = Math.random() * 0.5 + 0.3;
          return (
            <div
              key={i}
                  style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: "#fff",
                opacity,
                boxShadow: `0 0 6px 0 #fff8`,
              }}
            />
          );
        })}
      </div>
      {/* Down Arrow (bouncing, Tailwind) - absolutely positioned below the sun */}
      <div
        className="animate-bounce"
                  style={{
          position: "absolute",
          left: "50%",
          top: `calc(50% + 70px)`, // 50% + sun radius (18) + sun glow (38) + extra gap (14)
          transform: "translateX(-50%)",
          zIndex: 11,
        }}
      >
        <div className="w-12 h-12 rounded-full border-2 border-white border-opacity-60 flex items-center justify-center bg-transparent">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 8V20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 14L14 20L20 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
          </div>
      <style>{`
        ${PLANETS.map((p, i) => `
          @keyframes orbit-planet-${i} {
            0% { transform: rotate(${p.angle}deg); }
            100% { transform: rotate(${p.angle + 360}deg); }
          }
        `).join('\n')}

        @media (max-width: 900px) {
          nav {
            width: 98vw !important;
            padding: 0.5rem 1rem !important;
          }
          .main-heading-section {
            width: 98vw !important;
            top: 80px !important;
          }
          .glass-info-card {
            left: 10px !important;
            bottom: 10px !important;
            max-width: 95vw !important;
            padding: 18px 10px 16px 14px !important;
          }
        }
        @media (max-width: 600px) {
          nav {
            width: 100vw !important;
            padding: 0.5rem 0.5rem !important;
          }
          .nav-links {
            display: none !important;
          }
          .hamburger {
            display: block !important;
          }
          .main-heading-section {
            width: 99vw !important;
            top: 60px !important;
          }
          .main-heading-section h1 {
            font-size: 7vw !important;
          }
          .glass-info-card {
            left: 0 !important;
            bottom: 0 !important;
            max-width: 100vw !important;
            border-radius: 0 0 18px 0 !important;
            padding: 12px 6px 10px 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SolarSystemStatic;
