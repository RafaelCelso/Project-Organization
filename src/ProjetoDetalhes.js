import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faUsers, faBuilding, faInfoCircle, faEdit,
  faProjectDiagram, faUser, faEnvelope, faPhone, faToggleOn, faLink
} from '@fortawesome/free-solid-svg-icons';
import './ProjetoDetalhes.css';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import Select from 'react-select';

function ProjetoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projeto, setProjeto] = useState(null);
  const [formData, setFormData] = useState(null);
  const [colaboradoresFB, setColaboradoresFB] = useState({
    analistas: [],
    desenvolvedores: [],
    supervisores: []
  });

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'colaboradores'));
        const colaboradoresData = querySnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().nome || doc.data().nomeCompleto,
          cargo: doc.data().cargo
        }));

        const analistas = colaboradoresData.filter(col => col.cargo === 'Analista');
        const desenvolvedores = colaboradoresData.filter(col => col.cargo === 'Desenvolvedor');
        const supervisores = colaboradoresData.filter(col => col.cargo === 'Supervisor');

        setColaboradoresFB({
          analistas,
          desenvolvedores,
          supervisores
        });
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      }
    };

    fetchColaboradores();
  }, []);

  useEffect(() => {
    const fetchProjeto = async () => {
      try {
        if (location.state?.projeto) {
          setProjeto(location.state.projeto);
          setFormData(location.state.projeto);
          return;
        }

        const projetoRef = doc(db, 'projetos', id);
        const projetoDoc = await getDoc(projetoRef);
        
        if (projetoDoc.exists()) {
          const projetoData = { id: projetoDoc.id, ...projetoDoc.data() };
          setProjeto(projetoData);
          setFormData(projetoData);
        } else {
          console.error('Projeto não encontrado');
          navigate('/projetos');
        }
      } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        navigate('/projetos');
      }
    };

    fetchProjeto();
  }, [id, location.state, navigate]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'projetos', id));
      navigate('/projetos');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir o projeto. Por favor, tente novamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const projetoRef = doc(db, 'projetos', id);
      const projetoData = {
        ...formData,
        productionUrl: formData.productionUrl || null,
        stagingUrl: formData.stagingUrl || null
      };
      
      await updateDoc(projetoRef, projetoData);
      setProjeto(projetoData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Erro ao atualizar o projeto. Por favor, tente novamente.');
    }
  };

  if (!projeto) return <div>Carregando...</div>;

  return (
    <div className="projeto-detalhes-container">
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
              <div className="info-row">
                <span className="info-label">URL de Produção:</span>
                <span className="info-value">
                  {projeto.productionUrl ? (
                    <a 
                      href={projeto.productionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {projeto.productionUrl}
                    </a>
                  ) : (
                    <span className="text-gray-500">Não definido</span>
                  )}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">URL de Homologação:</span>
                <span className="info-value">
                  {projeto.stagingUrl ? (
                    <a 
                      href={projeto.stagingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {projeto.stagingUrl}
                    </a>
                  ) : (
                    <span className="text-gray-500">Não definido</span>
                  )}
                </span>
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
                <p>Principal: {Array.isArray(projeto.analistaPrincipal) 
                  ? projeto.analistaPrincipal.map(a => a.label).join(', ')
                  : ''}</p>
                <p>Backup: {Array.isArray(projeto.analistaBackup)
                  ? projeto.analistaBackup.map(a => a.label).join(', ')
                  : ''}</p>
              </div>
              <div className="membro">
                <h3>Desenvolvedores</h3>
                <p>Principal: {Array.isArray(projeto.desenvolvedorPrincipal)
                  ? projeto.desenvolvedorPrincipal.map(d => d.label).join(', ')
                  : ''}</p>
                <p>Backup: {Array.isArray(projeto.desenvolvedorBackup)
                  ? projeto.desenvolvedorBackup.map(d => d.label).join(', ')
                  : ''}</p>
              </div>
              <div className="membro">
                <h3>Supervisores</h3>
                <p>Principal: {Array.isArray(projeto.supervisorPrincipal)
                  ? projeto.supervisorPrincipal.map(s => s.label).join(', ')
                  : ''}</p>
                <p>Backup: {Array.isArray(projeto.supervisorBackup)
                  ? projeto.supervisorBackup.map(s => s.label).join(', ')
                  : ''}</p>
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
                  <Select
                    id="analistaPrincipal"
                    isMulti
                    options={colaboradoresFB.analistas}
                    value={formData.analistaPrincipal}
                    onChange={(selected) => setFormData({...formData, analistaPrincipal: selected || []})}
                    placeholder="Selecione os analistas..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="analistaBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Analista Backup
                  </label>
                  <Select
                    id="analistaBackup"
                    isMulti
                    options={colaboradoresFB.analistas}
                    value={formData.analistaBackup}
                    onChange={(selected) => setFormData({...formData, analistaBackup: selected || []})}
                    placeholder="Selecione os analistas backup..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="desenvolvedorPrincipal">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> 
                    Desenvolvedor Principal
                  </label>
                  <Select
                    id="desenvolvedorPrincipal"
                    isMulti
                    options={colaboradoresFB.desenvolvedores}
                    value={formData.desenvolvedorPrincipal}
                    onChange={(selected) => setFormData({...formData, desenvolvedorPrincipal: selected || []})}
                    placeholder="Selecione os desenvolvedores..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="desenvolvedorBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Desenvolvedor Backup
                  </label>
                  <Select
                    id="desenvolvedorBackup"
                    isMulti
                    options={colaboradoresFB.desenvolvedores}
                    value={formData.desenvolvedorBackup}
                    onChange={(selected) => setFormData({...formData, desenvolvedorBackup: selected || []})}
                    placeholder="Selecione os desenvolvedores backup..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="supervisorPrincipal">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> 
                    Supervisor Principal
                  </label>
                  <Select
                    id="supervisorPrincipal"
                    isMulti
                    options={colaboradoresFB.supervisores}
                    value={formData.supervisorPrincipal}
                    onChange={(selected) => setFormData({...formData, supervisorPrincipal: selected || []})}
                    placeholder="Selecione os supervisores..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="supervisorBackup">
                    <FontAwesomeIcon icon={faUsers} className="form-icon" /> 
                    Supervisor Backup
                  </label>
                  <Select
                    id="supervisorBackup"
                    isMulti
                    options={colaboradoresFB.supervisores}
                    value={formData.supervisorBackup}
                    onChange={(selected) => setFormData({...formData, supervisorBackup: selected || []})}
                    placeholder="Selecione os supervisores backup..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
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

                <div className="form-group">
                  <label htmlFor="productionUrl">
                    <FontAwesomeIcon icon={faLink} className="form-icon" /> 
                    URL de Produção
                  </label>
                  <input
                    type="url"
                    id="productionUrl"
                    value={formData.productionUrl || ''}
                    onChange={(e) => setFormData({...formData, productionUrl: e.target.value})}
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stagingUrl">
                    <FontAwesomeIcon icon={faLink} className="form-icon" /> 
                    URL de Homologação
                  </label>
                  <input
                    type="url"
                    id="stagingUrl"
                    value={formData.stagingUrl || ''}
                    onChange={(e) => setFormData({...formData, stagingUrl: e.target.value})}
                    placeholder="https://staging.exemplo.com"
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="delete-btn" onClick={handleDelete}>
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