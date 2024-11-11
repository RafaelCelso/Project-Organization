import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faCalendarAlt,
  faEllipsisV,
  faBuilding,
  faProjectDiagram,
  faUser,
  faEnvelope,
  faPhone,
  faToggleOn,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import "./Projetos.css";

function Projetos({ projetos, setProjetos }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    tipo: "",
    analistaPrincipal: "",
    analistaBackup: "",
    desenvolvedorPrincipal: "",
    desenvolvedorBackup: "",
    status: "",
    cliente: "",
    contatoCliente: {
      email: "",
      telefone: "",
    },
    supervisorPrincipal: "",
    supervisorBackup: "",
  });

  const [colaboradores] = useState({
    analistas: [
      { id: 1, nome: "Ana Silva" },
      { id: 2, nome: "João Santos" },
    ],
    desenvolvedores: [
      { id: 3, nome: "Pedro Costa" },
      { id: 4, nome: "Maria Oliveira" },
    ],
    supervisores: [
      { id: 5, nome: "Carlos Souza" },
      { id: 6, nome: "Patrícia Lima" },
    ],
  });

  // Adicionar estado para filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    status: '',
    analistaPrincipal: '',
    desenvolvedorPrincipal: '',
    supervisorPrincipal: ''
  });

  // Adicionar estado para projetos filtrados
  const [projetosFiltrados, setProjetosFiltrados] = useState(projetos);

  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    let resultado = projetos.filter(projeto => {
      let passouFiltro = true;

      // Filtro por texto (nome do projeto)
      if (filtros.busca) {
        passouFiltro = passouFiltro && projeto.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      }

      // Filtro por tipo
      if (filtros.tipo) {
        passouFiltro = passouFiltro && projeto.tipo === filtros.tipo;
      }

      // Filtro por status
      if (filtros.status) {
        passouFiltro = passouFiltro && projeto.status === filtros.status;
      }

      // Filtro por analista principal
      if (filtros.analistaPrincipal) {
        passouFiltro = passouFiltro && projeto.analistaPrincipal === filtros.analistaPrincipal;
      }

      // Filtro por desenvolvedor principal
      if (filtros.desenvolvedorPrincipal) {
        passouFiltro = passouFiltro && projeto.desenvolvedorPrincipal === filtros.desenvolvedorPrincipal;
      }

      // Filtro por supervisor principal
      if (filtros.supervisorPrincipal) {
        passouFiltro = passouFiltro && projeto.supervisorPrincipal === filtros.supervisorPrincipal;
      }

      return passouFiltro;
    });

    setProjetosFiltrados(resultado);
  };

  // Função para limpar os filtros
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      tipo: '',
      status: '',
      analistaPrincipal: '',
      desenvolvedorPrincipal: '',
      supervisorPrincipal: ''
    });
    setProjetosFiltrados(projetos);
  };

  // Atualizar os projetos filtrados quando os projetos ou filtros mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [projetos, filtros]);

  // Componente de filtros
  const renderFiltros = () => (
    <div className="filtros-container">
      <div className="filtros-grupo">
        <div className="filtro-busca">
          <div className="busca-input-container">
            <FontAwesomeIcon icon={faSearch} className="busca-icon" />
            <input
              type="text"
              placeholder="Buscar por nome do projeto..."
              value={filtros.busca}
              onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        <div className="filtro-select">
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todos os tipos</option>
            <option value="SAC">SAC</option>
            <option value="OL">OL</option>
            <option value="PSP">PSP</option>
            <option value="Interno">Interno</option>
          </select>
        </div>

        <div className="filtro-select">
          <select
            value={filtros.status}
            onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        <div className="filtro-select">
          <select
            value={filtros.analistaPrincipal}
            onChange={(e) => setFiltros({...filtros, analistaPrincipal: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todos os analistas</option>
            {colaboradores.analistas.map(analista => (
              <option key={analista.id} value={analista.nome}>{analista.nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-select">
          <select
            value={filtros.desenvolvedorPrincipal}
            onChange={(e) => setFiltros({...filtros, desenvolvedorPrincipal: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todos os desenvolvedores</option>
            {colaboradores.desenvolvedores.map(dev => (
              <option key={dev.id} value={dev.nome}>{dev.nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-select">
          <select
            value={filtros.supervisorPrincipal}
            onChange={(e) => setFiltros({...filtros, supervisorPrincipal: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todos os supervisores</option>
            {colaboradores.supervisores.map(supervisor => (
              <option key={supervisor.id} value={supervisor.nome}>{supervisor.nome}</option>
            ))}
          </select>
        </div>

        <div className="filtros-acoes">
          <button className="limpar-filtros-btn" onClick={limparFiltros}>
            <FontAwesomeIcon icon={faTimes} /> Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (location.state?.openEditModal && location.state?.projectToEdit) {
      setIsEditing(true);
      setFormData(location.state.projectToEdit);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleCardClick = (projeto) => {
    navigate(`/projetos/${projeto.id}`);
  };

  const handleOptionsClick = (e, projeto) => {
    e.stopPropagation(); // Evita que o clique propague para o card
    setIsEditing(true);
    setFormData(projeto);
    setIsModalOpen(true);
  };

  const handleDelete = (e, projeto) => {
    e.stopPropagation(); // Evita que o clique propague para o card
    setProjetoToDelete(projeto);
    setIsDeleteModalOpen(true);
  };

  const handleNewProject = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nome: "",
      tipo: "",
      analistaPrincipal: "",
      analistaBackup: "",
      desenvolvedorPrincipal: "",
      desenvolvedorBackup: "",
      status: "",
      cliente: "",
      contatoCliente: {
        email: "",
        telefone: "",
      },
      supervisorPrincipal: "",
      supervisorBackup: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing) {
      // Atualiza o projeto existente
      setProjetos(
        projetos.map((projeto) =>
          projeto.id === formData.id ? formData : projeto
        )
      );
    } else {
      // Cria novo projeto
      const novoProjeto = {
        ...formData,
        id: projetos.length + 1,
        kanban: {
          aDefinir: [],
          todo: [],
          inProgress: [],
          testing: [],
          prontoDeploy: [],
          done: [],
          arquivado: [],
        },
      };
      setProjetos([...projetos, novoProjeto]);
    }

    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      id: null,
      nome: "",
      tipo: "",
      analistaPrincipal: "",
      analistaBackup: "",
      desenvolvedorPrincipal: "",
      desenvolvedorBackup: "",
      status: "",
      cliente: "",
      contatoCliente: {
        email: "",
        telefone: "",
      },
      supervisorPrincipal: "",
      supervisorBackup: "",
    });
  };

  const handleDeleteFromModal = () => {
    setProjetoToDelete(formData);
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setProjetos(
      projetos.filter((projeto) => projeto.id !== projetoToDelete.id)
    );
    setIsDeleteModalOpen(false);
    setProjetoToDelete(null);
    setFormData({
      id: null,
      nome: "",
      tipo: "",
      analistaPrincipal: "",
      analistaBackup: "",
      desenvolvedorPrincipal: "",
      desenvolvedorBackup: "",
      status: "",
      cliente: "",
      contatoCliente: {
        email: "",
        telefone: "",
      },
      supervisorPrincipal: "",
      supervisorBackup: "",
    });
  };

  // Adicionar a função handleKeyPress
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  return (
    <div className="projetos-container">
      <Sidebar />
      <div className="projetos-content">
        <div className="header-with-button">
          <h1 className="page-title">Projetos</h1>
          <button className="new-project-btn" onClick={handleNewProject}>
            Novo Projeto
          </button>
        </div>

        {renderFiltros()}

        <div className="projects-grid">
          {projetosFiltrados.map((projeto) => (
            <div
              key={projeto.id}
              className={`project-card ${
                projeto.id === selectedProject?.id ? "selected" : ""
              }`}
              onClick={() => handleCardClick(projeto)}
            >
              <div className="project-card-header">
                <h3>{projeto.nome}</h3>
                <div className="project-card-actions">
                  <button
                    className="options-btn"
                    onClick={(e) => handleOptionsClick(e, projeto)}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>
                </div>
              </div>

              <div className="project-type-badge">{projeto.tipo}</div>

              <div className="project-info">
                <div className="info-row">
                  <FontAwesomeIcon icon={faUsers} className="info-icon" />
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">Cliente:</span>
                      <span>{projeto.cliente}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Analista:</span>
                      <span>{projeto.analistaPrincipal}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Desenvolvedor:</span>
                      <span>{projeto.desenvolvedorPrincipal}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Supervisor:</span>
                      <span>{projeto.supervisorPrincipal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="project-status">
                <span
                  className={`status-badge status-${projeto.status.toLowerCase()}`}
                >
                  {projeto.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{isEditing ? "Editar Projeto" : "Novo Projeto"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group full-width">
                  <label htmlFor="nome">
                    <FontAwesomeIcon
                      icon={faProjectDiagram}
                      className="form-icon"
                    />
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, cliente: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        analistaPrincipal: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.analistas.map((analista) => (
                      <option key={analista.id} value={analista.nome}>
                        {analista.nome}
                      </option>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        analistaBackup: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.analistas.map((analista) => (
                      <option key={analista.id} value={analista.nome}>
                        {analista.nome}
                      </option>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        desenvolvedorPrincipal: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.desenvolvedores.map((dev) => (
                      <option key={dev.id} value={dev.nome}>
                        {dev.nome}
                      </option>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        desenvolvedorBackup: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.desenvolvedores.map((dev) => (
                      <option key={dev.id} value={dev.nome}>
                        {dev.nome}
                      </option>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supervisorPrincipal: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.supervisores.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.nome}>
                        {supervisor.nome}
                      </option>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supervisorBackup: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.supervisores.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.nome}>
                        {supervisor.nome}
                      </option>
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
                    value={formData.contatoCliente.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contatoCliente: {
                          ...formData.contatoCliente,
                          email: e.target.value,
                        },
                      })
                    }
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
                    value={formData.contatoCliente.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contatoCliente: {
                          ...formData.contatoCliente,
                          telefone: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={handleDeleteFromModal}
                    >
                      Excluir
                    </button>
                  )}
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>
                Tem certeza que deseja excluir o projeto "
                {projetoToDelete?.nome}"?
              </p>
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setProjetoToDelete(null);
                    setIsModalOpen(true); // Retorna ao modal de edição
                  }}
                >
                  Cancelar
                </button>
                <button className="delete-btn" onClick={confirmDelete}>
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

export default Projetos;
