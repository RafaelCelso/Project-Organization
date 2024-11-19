import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faCamera } from '@fortawesome/free-solid-svg-icons';
import './Perfil.css';

function Perfil() {
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const fileInputRef = useRef(null);
  
  const userData = {
    nome: 'João Silva',
    email: 'joao.silva@exemplo.com',
    cargo: 'Desenvolvedor Senior',
    status: 'Ativo'
  };

  const handleAlterarSenha = () => {
    alert('Funcionalidade de alteração de senha será implementada!');
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verifica se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Verifica o tamanho do arquivo (limite de 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>Meu Perfil</h1>
      </div>

      <div className="perfil-content">
        <div className="perfil-avatar">
          <div className="avatar-container" onClick={handleAvatarClick}>
            <img 
              src={avatarUrl} 
              alt="Avatar do usuário" 
              className="avatar-image"
            />
            <div className="avatar-overlay">
              <FontAwesomeIcon icon={faCamera} />
              <span>Alterar foto</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className="perfil-info">
          <div className="info-group">
            <label>Nome:</label>
            <div className="info-value">{userData.nome}</div>
          </div>

          <div className="info-group">
            <label>E-mail:</label>
            <div className="info-value">{userData.email}</div>
          </div>

          <div className="info-group">
            <label>Cargo:</label>
            <div className="info-value">{userData.cargo}</div>
          </div>

          <div className="info-group">
            <label>Status:</label>
            <div className="info-value">
              <span className="status-badge">{userData.status}</span>
            </div>
          </div>

          <div className="senha-button-container">
            <button 
              className="alterar-senha-button"
              onClick={handleAlterarSenha}
            >
              <FontAwesomeIcon icon={faKey} />
              Alterar Senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil; 