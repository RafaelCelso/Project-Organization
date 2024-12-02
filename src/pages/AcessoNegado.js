import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AcessoNegado.css';

function AcessoNegado() {
  const navigate = useNavigate();

  return (
    <div className="acesso-negado-container">
      <div className="acesso-negado-content">
        <div className="acesso-negado-icon">
          <i className="material-icons">gpp_bad</i>
        </div>
        
        <h1>Acesso Negado</h1>
        
        <p className="acesso-negado-message">
          Você não tem permissão para acessar esta página.
          Entre em contato com o administrador do sistema caso precise de acesso.
        </p>

        <div className="acesso-negado-actions">
          <button 
            className="btn-home"
            onClick={() => navigate('/')}
          >
            <i className="material-icons">home</i>
            Ir para Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcessoNegado; 