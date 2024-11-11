import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faUsers, faBuilding, faInfoCircle, faEdit,
  faProjectDiagram, faUser, faEnvelope, faPhone, faToggleOn
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import './ProjetoDetalhes.css';

function ProjetoDetalhes({ projetos, setProjetos }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projeto, setProjeto] = useState(null);
  const [formData, setFormData] = useState(null);
  const [colaboradores] = useState({
    analistas: [
      { id: 1, nome: "Ana Silva" },
      { id: 2, nome: "João Santos" }
    ],
    desenvolvedores: [
      { id: 3, nome: "Pedro Costa" },
      { id: 4, nome: "Maria Oliveira" }
    ],
    supervisores: [
      { id: 5, nome: "Carlos Souza" },
      { id: 6, nome: "Patrícia Lima" }
    ]
  });

  // Busca o projeto quando o componente é montado ou quando projetos é atualizado
  useEffect(() => {
    const projetoAtual = projetos.find(p => p.id === parseInt(id));
    if (projetoAtual) {
      setProjeto(projetoAtual);
      setFormData(projetoAtual);
    }
  }, [id, projetos]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedProjetos = projetos.filter(p => p.id !== parseInt(id));
    setProjetos(updatedProjetos);
    setIsDeleteModalOpen(false);
    navigate('/projetos'); // Retorna para a lista de projetos após excluir
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Atualiza o projeto na lista de projetos
    const updatedProjetos = projetos.map(p => 
      p.id === parseInt(id) ? formData : p
    );
    
    setProjetos(updatedProjetos);
    setProjeto(formData); // Atualiza o estado local do projeto
    setIsModalOpen(false);
  };

  if (!projeto) return null;

  return (
    <div className="projeto-detalhes-container">
      <Sidebar />
      <div className="projeto-detalhes-content">
        <div className="projeto-header">
          <button className="voltar-btn" onClick={() => navigate('/projetos')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar
          </button>
          <div className="projeto-titulo">
            <h1>{projeto.nome}</h1>
            <div className="projeto-acoes">
              <span className={`status-badge status-${projeto.status.toLowerCase()}`}>
                {projeto.status}
              </span>
              <button className="edit-btn" onClick={handleEdit}>
                <FontAwesomeIcon icon={faEdit} /> Editar
              </button>
            </div>
          </div>
        </div>

        <div className="projeto-grid">
          {/* Informações do Cliente */}
          <div className="projeto-card cliente">
            <h2>
              <FontAwesomeIcon icon={faBuilding} /> Informações do Cliente
            </h2>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Nome:</span>
                <span className="info-value">{projeto.cliente}</span>
              </div>
              <div className="info-row">
                <span className="info-label">E-mail:</span>
                <span className="info-value">{projeto.contatoCliente.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Telefone:</span>
                <span className="info-value">{projeto.contatoCliente.telefone}</span>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="projeto-card info-basicas">
            <h2>
              <FontAwesomeIcon icon={faInfoCircle} /> Informações Básicas
            </h2>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Tipo:</span>
                <span className="info-value">{projeto.tipo}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value status-tag">{projeto.status}</span>
              </div>
            </div>
          </div>

          {/* Equipe */}
          <div className="projeto-card equipe">
            <h2>
              <FontAwesomeIcon icon={faUsers} /> Equipe
            </h2>
            <div className="equipe-content">
              <div className="membro">
                <h3>Analistas</h3>
                <p>Principal: {projeto.analistaPrincipal}</p>
                <p>Backup: {projeto.analistaBackup}</p>
              </div>
              <div className="membro">
                <h3>Desenvolvedores</h3>
                <p>Principal: {projeto.desenvolvedorPrincipal}</p>
                <p>Backup: {projeto.desenvolvedorBackup}</p>
              </div>
              <div className="membro">
                <h3>Supervisores</h3>
                <p>Principal: {projeto.supervisorPrincipal}</p>
                <p>Backup: {projeto.supervisorBackup}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editar Projeto</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group full-width">
                  <label htmlFor="nome">
                    <FontAwesomeIcon icon={faProjectDiagram} className="form-icon" /> 
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tipo">
                    <FontAwesomeIcon icon={faBuilding} className="form-icon" /> 
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="SAC">SAC</option>
                    <option value="OL">OL</option>
                    <option value="PSP">PSP</option>
                    <option value="Interno">Interno</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    <FontAwesomeIcon icon={faToggleOn} className="form-icon" /> 
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cliente">
                    <FontAwesomeIcon icon={faBuilding} className="form-icon" /> 
                    Cliente
                  </label>
                  <input
                    type="text"
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="analistaPrincipal">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> 
                    Analista Principal
                  </label>
                  <select
                    id="analistaPrincipal"
                    value={formData.analistaPrincipal}
                    onChange={(e) => setFormData({...formData, analistaPrincipal: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.analistas.map(analista => (
                      <option key={analista.id} value={analista.nome}>{analista.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="analistaBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Analista Backup
                  </label>
                  <select
                    id="analistaBackup"
                    value={formData.analistaBackup}
                    onChange={(e) => setFormData({...formData, analistaBackup: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.analistas.map(analista => (
                      <option key={analista.id} value={analista.nome}>{analista.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="desenvolvedorPrincipal">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> 
                    Desenvolvedor Principal
                  </label>
                  <select
                    id="desenvolvedorPrincipal"
                    value={formData.desenvolvedorPrincipal}
                    onChange={(e) => setFormData({...formData, desenvolvedorPrincipal: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.desenvolvedores.map(dev => (
                      <option key={dev.id} value={dev.nome}>{dev.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="desenvolvedorBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Desenvolvedor Backup
                  </label>
                  <select
                    id="desenvolvedorBackup"
                    value={formData.desenvolvedorBackup}
                    onChange={(e) => setFormData({...formData, desenvolvedorBackup: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.desenvolvedores.map(dev => (
                      <option key={dev.id} value={dev.nome}>{dev.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="supervisorPrincipal">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> 
                    Supervisor Principal
                  </label>
                  <select
                    id="supervisorPrincipal"
                    value={formData.supervisorPrincipal}
                    onChange={(e) => setFormData({...formData, supervisorPrincipal: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.supervisores.map(supervisor => (
                      <option key={supervisor.id} value={supervisor.nome}>{supervisor.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="supervisorBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Supervisor Backup
                  </label>
                  <select
                    id="supervisorBackup"
                    value={formData.supervisorBackup}
                    onChange={(e) => setFormData({...formData, supervisorBackup: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.supervisores.map(supervisor => (
                      <option key={supervisor.id} value={supervisor.nome}>{supervisor.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="emailCliente">
                    <FontAwesomeIcon icon={faEnvelope} className="form-icon" /> 
                    E-mail do Cliente
                  </label>
                  <input
                    type="email"
                    id="emailCliente"
                    value={formData.contatoCliente?.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contatoCliente: {
                        ...formData.contatoCliente,
                        email: e.target.value
                      }
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefoneCliente">
                    <FontAwesomeIcon icon={faPhone} className="form-icon" /> 
                    Telefone do Cliente
                  </label>
                  <input
                    type="tel"
                    id="telefoneCliente"
                    value={formData.contatoCliente?.telefone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contatoCliente: {
                        ...formData.contatoCliente,
                        telefone: e.target.value
                      }
                    })}
                    required
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="delete-btn"
                    onClick={handleDelete}
                  >
                    Excluir
                  </button>
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o projeto "{projeto?.nome}"?</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setIsModalOpen(true); // Retorna ao modal de edição
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDelete}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjetoDetalhes; 