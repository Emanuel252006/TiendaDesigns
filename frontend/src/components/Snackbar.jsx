import React from "react";
import "./Snackbar.css";

export default function Snackbar({ open, message, type = "success", onClose, duration = 3000 }) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  return (
    <div className={`snackbar ${type}${open ? " show" : ""}`}>{message}</div>
  );
} 