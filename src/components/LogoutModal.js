import React from 'react';
import './LogoutModal.css';

function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Logout</h2>
        <p>Tem certeza que deseja sair?</p>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="modal-button confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal; 