import React, { useState } from 'react';
import './VerificationModal.css';

const VerificationModal = ({ show, onClose, onVerify, onResend, correo, error, loading, resendMsg, resendLoading, resendDisabled }) => {
  const [code, setCode] = useState('');

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-custom">
        <h4 className="modal-title">Verifica tu correo</h4>
        <p>Hemos enviado un código de verificación a <b>{correo}</b>. Ingresa el código para completar tu registro.</p>
        <input
          type="text"
          placeholder="Código de verificación"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="modal-input"
        />
        {/* Mensaje de ayuda para el usuario si no recibió el código */}
        <div className="modal-help-msg">
          ¿No recibiste el mensaje? Revisa tu correo (incluida la carpeta de spam) o verifica que hayas ingresado un correo real y correcto.
        </div>
        {error && <div className="modal-error">{error}</div>}
        {resendMsg && <div className="modal-resend-msg">{resendMsg}</div>}
        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="modal-btn-cancel" onClick={onClose} disabled={loading || resendLoading}>Cancelar</button>
          <button
            className="modal-btn-resend"
            onClick={onResend}
            disabled={resendLoading || resendDisabled}
            style={{ marginRight: 'auto' }}
          >
            {resendLoading ? 'Reenviando...' : 'Reenviar código'}
          </button>
          <button className="modal-btn-black" onClick={() => onVerify(code)} disabled={loading || !code}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal; 