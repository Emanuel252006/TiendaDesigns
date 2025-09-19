import React from "react";
import "./ConfirmationModal.css";

export default function ConfirmationModal({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning"
}) {
  if (!open) return null;

  return (
    <div className="confirmation-overlay">
      <div className={`confirmation-modal ${type}`}>
        <div className="confirmation-header">
          <h4>{title}</h4>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-actions">
          <button 
            className="btn btn-secondary confirmation-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn confirmation-btn-confirm ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 