import React from "react";

export function LoadingState({ label = "Laden..." }) {
  return <div className="state-panel">{label}</div>;
}
