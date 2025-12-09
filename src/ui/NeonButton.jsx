import React from "react";

export default function NeonButton({ text, color = "#5b8fc7", onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `2px solid ${color}`,
        borderRadius: "8px",
        padding: "0.8rem 1.5rem",
        margin: "0.5rem",
        color,
        fontFamily: "Orbitron, sans-serif",
        fontSize: "1rem",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: `0 0 8px ${color}`,
      }}
      onMouseEnter={(e) => (e.target.style.boxShadow = `0 0 20px ${color}`)}
      onMouseLeave={(e) => (e.target.style.boxShadow = `0 0 8px ${color}`)}
    >
      {text}
    </button>
  );
}
