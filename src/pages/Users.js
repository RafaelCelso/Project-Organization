import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import './Users.css';

function Users() {
  const [users, setUsers] = useState([
    { id: 1, nome: 'João Silva', email: 'joao@exemplo.com', cargo: 'Desenvolvedor', status: 'Ativo' },
    { id: 2, nome: 'Maria Santos', email: 'maria@exemplo.com', cargo: 'Designer', status: 'Ativo' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@exemplo.com', cargo: 'Gerente', status: 'Inativo' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    email: '',
    cargo: '',
    status: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleEdit = (user) => {
    setIsEditing(true);
    setFormData(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica para salvar/editar usuário
    setIsModalOpen(false);
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
          <button className="users-new-btn" onClick={() => setIsModalOpen(true)}>
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
                <option value="Desenvolvedor">Desenvolvedor</option>
                <option value="Designer">Designer</option>
                <option value="Gerente">Gerente</option>
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
                <label htmlFor="cargo">Cargo</label>
                <select
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Desenvolvedor">Desenvolvedor</option>
                  <option value="Designer">Designer</option>
                  <option value="Gerente">Gerente</option>
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

              {isEditing && (
                <>
                  <div className="users-form-group">
                    <label htmlFor="senha">Nova Senha</label>
                    <input
                      type="password"
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      placeholder="Digite para alterar a senha"
                    />
                    <small className="users-form-help">Deixe em branco para manter a senha atual</small>
                  </div>

                  <div className="users-form-group">
                    <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      id="confirmarSenha"
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </>
              )}

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
                  // Lógica para excluir usuário
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
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