import React from "react";

export function ErrorState({ message }) {
  return <div className="state-panel error">{message}</div>;
}
