import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Users.css';

function Users() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    email: '',
    cargo: '',
    status: '',
    senha: '',
    confirmarSenha: '',
    colaboradorId: ''
  });

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      // Aqui você pode adicionar uma notificação de erro
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar função para carregar colaboradores com ordenação
  const loadColaboradores = async () => {
    try {
      const colaboradoresRef = collection(db, 'colaboradores');
      const snapshot = await getDocs(colaboradoresRef);
      const colaboradoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })); // Ordenação alfabética
      
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
    }
  };

  // Atualizar useEffect para carregar colaboradores junto com usuários
  useEffect(() => {
    loadUsers();
    loadColaboradores();
  }, []);

  const handleEdit = (user) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      status: user.status,
      senha: '',
      confirmarSenha: '',
      colaboradorId: user.colaboradorId
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!userToDelete?.id) return;
      
      await deleteDoc(doc(db, 'users', userToDelete.id));
      await loadUsers(); // Recarrega a lista
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      // Aqui você pode adicionar uma notificação de sucesso
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação de senha
    if (!isEditing && formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      const userData = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        status: formData.status,
        updatedAt: serverTimestamp()
      };

      if (!isEditing) {
        // Criando novo usuário
        userData.senha = formData.senha; // Em produção, use hash
        userData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users'), userData);
      } else {
        // Atualizando usuário existente
        const userRef = doc(db, 'users', formData.id);
        if (formData.senha) {
          userData.senha = formData.senha; // Em produção, use hash
        }
        await updateDoc(userRef, userData);
      }

      await loadUsers(); // Recarrega a lista
      setIsModalOpen(false);
      // Aqui você pode adicionar uma notificação de sucesso
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  const handleNewUser = () => {
    setFormData({
      id: null,
      nome: '',
      email: '',
      cargo: '',
      status: '',
      senha: '',
      confirmarSenha: '',
      colaboradorId: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  return (
    <div className="users-page-container">
      <div className="users-header">
        <h1 className="users-title">Usuários</h1>
        <div className="users-header-buttons">
          <button className="users-export-button">
            <FontAwesomeIcon icon={faFileExcel} />
            Exportar para Excel
          </button>
          <button className="users-new-btn" onClick={handleNewUser}>
            <FontAwesomeIcon icon={faPlus} />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="users-filters">
        <div className="users-filters-container">
          <div className="users-filters-row">
            <div className="users-filter-group">
              <label>Nome</label>
              <div className="users-search-container">
                <i className="material-icons users-search-icon">search</i>
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  name="nome"
                  className="users-search-input"
                />
              </div>
            </div>
          </div>

          <div className="users-filters-row">
            <div className="users-filter-group">
              <label>Cargo</label>
              <select className="users-select">
                <option value="">Todos os cargos</option>
                <option value="Analista">Analista</option>
                <option value="Desenvolvedor">Desenvolvedor</option>
                <option value="Supervisor">Supervisor</option>
              </select>
            </div>

            <div className="users-filter-group">
              <label>Status</label>
              <select className="users-select">
                <option value="">Todos os status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <button className="users-clear-filters">
          <i className="material-icons">clear</i>
          Limpar Filtros
        </button>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : (
        <div className="users-grid">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>{user.cargo}</td>
                  <td className={`users-status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </td>
                  <td className="users-actions">
                    <button 
                      className="users-icon-button edit"
                      onClick={() => handleEdit(user)}
                      title="Editar"
                    >
                      <i className="material-icons">create</i>
                    </button>
                    <button 
                      className="users-icon-button delete"
                      onClick={() => handleDelete(user)}
                      title="Excluir"
                    >
                      <i className="material-icons">delete_outline</i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <button 
              className="users-close-btn"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              ×
            </button>
            <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="users-form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="colaborador">Colaborador</label>
                <select
                  id="colaborador"
                  name="colaboradorId"
                  value={formData.colaboradorId}
                  onChange={(e) => setFormData({...formData, colaboradorId: e.target.value})}
                  required
                >
                  <option value="">Selecione um colaborador...</option>
                  {colaboradores.map(colaborador => (
                    <option key={colaborador.id} value={colaborador.id}>
                      {colaborador.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="users-form-group">
                <label htmlFor="cargo">Cargo</label>
                <select
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Analista">Analista</option>
                  <option value="Desenvolvedor">Desenvolvedor</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="users-form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="users-form-group">
                <label htmlFor="senha">Senha</label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  required={!isEditing} // Senha obrigatória apenas na criação
                  placeholder="Digite a senha"
                />
              </div>

              <div className="users-form-group">
                <label htmlFor="confirmarSenha">Confirmar Senha</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                  required={!isEditing} // Confirmação obrigatória apenas na criação
                  placeholder="Confirme a senha"
                />
              </div>

              <div className="users-modal-buttons">
                <button type="button" className="users-cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="users-save-btn">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && userToDelete && (
        <div className="users-modal-overlay">
          <div className="users-modal users-delete-modal">
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir o usuário "{userToDelete.nome}"?</p>
            <div className="users-modal-buttons">
              <button 
                className="users-cancel-btn" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="users-save-btn"
                onClick={() => {
                  confirmDelete();
                }}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users; 