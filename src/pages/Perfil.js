import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faCamera } from '@fortawesome/free-solid-svg-icons';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Perfil.css';

function Perfil() {
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/149/149071.png');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSenhaModalOpen, setIsSenhaModalOpen] = useState(false);
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const fileInputRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    document.documentElement.getAttribute('data-sidebar-collapsed') === 'true'
  );
  const [senhaError, setSenhaError] = useState('');
  const [confirmSenhaError, setConfirmSenhaError] = useState('');

  useEffect(() => {
    carregarDadosUsuario();

    // Observer para mudanças no atributo data-sidebar-collapsed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-sidebar-collapsed') {
          setSidebarCollapsed(
            document.documentElement.getAttribute('data-sidebar-collapsed') === 'true'
          );
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed']
    });

    return () => observer.disconnect();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.id) {
        throw new Error('Informações do usuário não encontradas');
      }

      const userDoc = await getDoc(doc(db, 'users', userInfo.id));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      alert('Erro ao carregar dados do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlterarSenha = () => {
    setIsSenhaModalOpen(true);
  };

  const handleSenhaSubmit = async (e) => {
    e.preventDefault();
    setSenhaError('');
    setConfirmSenhaError('');
    
    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setConfirmSenhaError('As senhas não coincidem');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      const credential = EmailAuthProvider.credential(
        user.email,
        senhaForm.senhaAtual
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, senhaForm.novaSenha);

      alert('Senha alterada com sucesso!');
      setIsSenhaModalOpen(false);
      setSenhaForm({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error.code === 'auth/wrong-password') {
        setSenhaError('Senha atual incorreta');
      } else {
        setSenhaError('Erro ao alterar senha. Tente novamente.');
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

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

  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className={`perfil-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            <label>Nome</label>
            <div className="info-value">{userData?.nome}</div>
          </div>

          <div className="info-group">
            <label>E-mail</label>
            <div className="info-value">{userData?.email}</div>
          </div>

          <div className="info-group">
            <label>Cargo</label>
            <div className="info-value">{userData?.cargo}</div>
          </div>

          <div className="info-group">
            <label>Status</label>
            <div className="info-value">
              <span className="status-badge">{userData?.status}</span>
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

      {isSenhaModalOpen && (
        <div className="modal-overlay">
          <div className="senha-modal-content">
            <h2>Alterar Senha</h2>
            <form onSubmit={handleSenhaSubmit}>
              <div className="form-group">
                <label>Senha Atual</label>
                <input
                  type="password"
                  value={senhaForm.senhaAtual}
                  onChange={(e) => {
                    setSenhaForm({...senhaForm, senhaAtual: e.target.value});
                    setSenhaError('');
                  }}
                  className={senhaError ? 'input-error' : ''}
                  required
                />
                {senhaError && <div className="error-message">{senhaError}</div>}
              </div>
              <div className="form-group">
                <label>Nova Senha</label>
                <input
                  type="password"
                  value={senhaForm.novaSenha}
                  onChange={(e) => {
                    setSenhaForm({...senhaForm, novaSenha: e.target.value});
                    setConfirmSenhaError('');
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={senhaForm.confirmarSenha}
                  onChange={(e) => {
                    setSenhaForm({...senhaForm, confirmarSenha: e.target.value});
                    setConfirmSenhaError('');
                  }}
                  className={confirmSenhaError ? 'input-error' : ''}
                  required
                />
                {confirmSenhaError && <div className="error-message">{confirmSenhaError}</div>}
              </div>
              <div className="senha-modal-buttons">
                <button type="button" onClick={() => setIsSenhaModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil; 