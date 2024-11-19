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
  faPlus,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import "./Projetos.css";
import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

function Projetos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [colaboradoresFB, setColaboradoresFB] = useState({
    analistas: [],
    desenvolvedores: [],
    supervisores: []
  });

  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    tipo: "",
    analistaPrincipal: [],
    analistaBackup: [],
    desenvolvedorPrincipal: [],
    desenvolvedorBackup: [],
    status: "",
    cliente: "",
    contatoCliente: {
      email: "",
      telefone: "",
    },
    supervisorPrincipal: [],
    supervisorBackup: [],
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
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);

  // Adicione um estado para projetos
  const [projetos, setProjetos] = useState([]);

  // Adicionar o estado para o modal de feedback (logo após os outros estados)
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    message: '',
    type: '' // 'success' ou 'error'
  });

  // Função para aplicar filtros
  const aplicarFiltros = () => {
    let resultado = projetos.filter(projeto => {
      let passouFiltro = true;

      if (filtros.busca) {
        passouFiltro = passouFiltro && projeto.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      }

      if (filtros.tipo) {
        passouFiltro = passouFiltro && projeto.tipo === filtros.tipo;
      }

      if (filtros.status) {
        passouFiltro = passouFiltro && projeto.status === filtros.status;
      }

      if (filtros.analistaPrincipal) {
        passouFiltro = passouFiltro && projeto.analistaPrincipal?.some(
          analista => analista.label === filtros.analistaPrincipal
        );
      }

      if (filtros.desenvolvedorPrincipal) {
        passouFiltro = passouFiltro && projeto.desenvolvedorPrincipal?.some(
          dev => dev.label === filtros.desenvolvedorPrincipal
        );
      }

      if (filtros.supervisorPrincipal) {
        passouFiltro = passouFiltro && projeto.supervisorPrincipal?.some(
          supervisor => supervisor.label === filtros.supervisorPrincipal
        );
      }

      return passouFiltro;
    });

    setProjetosFiltrados(resultado);
  };

  // Função para renderizar os filtros
  const renderFiltros = () => (
    <div className="filtros-section">
      <div className="filtros-container">
        <div className="filtros-linha">
          <div className="filtro-grupo">
            <label>Nome</label>
            <div className="busca-input-container">
              <i className="material-icons busca-icon">search</i>
              <input
                type="text"
                placeholder="Buscar por nome do projeto..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>

        <div className="filtros-linha">
          <div className="filtro-grupo">
            <label>Tipo</label>
            <Select
              value={[
                { value: filtros.tipo, label: filtros.tipo }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, tipo: option ? option.value : ''})}
              options={[
                ...Array.from(new Set(projetos.map(p => p.tipo)))
                  .filter(Boolean)
                  .map(tipo => ({ value: tipo, label: tipo }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Status</label>
            <Select
              value={[
                { value: filtros.status, label: filtros.status }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, status: option ? option.value : ''})}
              options={[
                ...Array.from(new Set(projetos.map(p => p.status)))
                  .filter(Boolean)
                  .map(status => ({ value: status, label: status }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Analista</label>
            <Select
              value={[
                { value: filtros.analistaPrincipal, label: filtros.analistaPrincipal }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, analistaPrincipal: option ? option.value : ''})}
              options={[
                ...Array.from(new Set(projetos.flatMap(p => 
                  p.analistaPrincipal?.map(a => a.label) || []
                )))
                  .filter(Boolean)
                  .map(analista => ({ value: analista, label: analista }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Desenvolvedor</label>
            <Select
              value={[
                { value: filtros.desenvolvedorPrincipal, label: filtros.desenvolvedorPrincipal }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, desenvolvedorPrincipal: option ? option.value : ''})}
              options={[
                ...Array.from(new Set(projetos.flatMap(p => 
                  p.desenvolvedorPrincipal?.map(d => d.label) || []
                )))
                  .filter(Boolean)
                  .map(dev => ({ value: dev, label: dev }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Supervisor</label>
            <Select
              value={[
                { value: filtros.supervisorPrincipal, label: filtros.supervisorPrincipal }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, supervisorPrincipal: option ? option.value : ''})}
              options={[
                ...Array.from(new Set(projetos.flatMap(p => 
                  p.supervisorPrincipal?.map(s => s.label) || []
                )))
                  .filter(Boolean)
                  .map(supervisor => ({ value: supervisor, label: supervisor }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>
        </div>
      </div>

      <button 
        className="limpar-filtros-btn"
        onClick={limparFiltros}
      >
        <FontAwesomeIcon icon={faTimes} />
        Limpar Filtros
      </button>
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
    try {
      if (projeto && projeto.id) {
        console.log('Navegando para o projeto:', projeto); // Para debug
        navigate(`/projetos/${projeto.id}`, { 
          state: { 
            projeto: projeto 
          }
        });
      } else {
        console.error('Projeto inválido:', projeto);
      }
    } catch (error) {
      console.error('Erro ao navegar para o projeto:', error);
    }
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

  const limparFormulario = () => {
    setFormData({
      id: null,
      nome: "",
      tipo: "",
      analistaPrincipal: [],
      analistaBackup: [],
      desenvolvedorPrincipal: [],
      desenvolvedorBackup: [],
      status: "",
      cliente: "",
      contatoCliente: {
        email: "",
        telefone: "",
      },
      supervisorPrincipal: [],
      supervisorBackup: [],
    });
    setIsEditing(false);
  };

  const handleNewProject = () => {
    setIsEditing(false);
    limparFormulario();
    setIsModalOpen(true);
  };

  // Função para salvar projeto
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepara os dados do projeto
      const projetoData = {
        nome: formData.nome,
        tipo: formData.tipo,
        status: formData.status,
        cliente: formData.cliente,
        contatoCliente: {
          email: formData.contatoCliente.email,
          telefone: formData.contatoCliente.telefone
        },
        analistaPrincipal: formData.analistaPrincipal || [],
        analistaBackup: formData.analistaBackup || [],
        desenvolvedorPrincipal: formData.desenvolvedorPrincipal || [],
        desenvolvedorBackup: formData.desenvolvedorBackup || [],
        supervisorPrincipal: formData.supervisorPrincipal || [],
        supervisorBackup: formData.supervisorBackup || [],
        kanban: {
          aDefinir: [],
          todo: [],
          inProgress: [],
          testing: [],
          prontoDeploy: [],
          done: [],
          arquivado: []
        },
        dataCriacao: new Date().toISOString()
      };

      if (isEditing) {
        // Atualiza projeto existente
        const projetoRef = doc(db, 'projetos', formData.id);
        await updateDoc(projetoRef, projetoData);
        
        // Atualiza estado local
        setProjetos(projetos.map(projeto => 
          projeto.id === formData.id ? { ...projetoData, id: formData.id } : projeto
        ));
        
        setFeedbackModal({
          isOpen: true,
          message: "Projeto atualizado com sucesso!",
          type: 'success'
        });
      } else {
        // Cria novo projeto
        const docRef = await addDoc(collection(db, 'projetos'), projetoData);
        const novoProjeto = { ...projetoData, id: docRef.id };
        
        // Atualiza estado local
        setProjetos(prevProjetos => [...prevProjetos, novoProjeto]);
        
        setFeedbackModal({
          isOpen: true,
          message: "Projeto criado com sucesso!",
          type: 'success'
        });
      }

      // Fecha o modal e limpa o formulário
      setIsModalOpen(false);
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      setFeedbackModal({
        isOpen: true,
        message: "Erro ao salvar o projeto. Por favor, tente novamente.",
        type: 'error'
      });
    }
  };

  const handleDeleteFromModal = () => {
    setProjetoToDelete(formData);
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  // Função para excluir projeto
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'projetos', projetoToDelete.id));
      setProjetos(projetos.filter(projeto => projeto.id !== projetoToDelete.id));
      setIsDeleteModalOpen(false);
      setProjetoToDelete(null);
      limparFormulario();
      
      setFeedbackModal({
        isOpen: true,
        message: "Projeto excluído com sucesso!",
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      setFeedbackModal({
        isOpen: true,
        message: "Erro ao excluir o projeto. Por favor, tente novamente.",
        type: 'error'
      });
    }
  };

  // Adicionar a função handleKeyPress
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  // Função para buscar colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'colaboradores'));
        const colaboradoresData = querySnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().nome || doc.data().nomeCompleto,
          cargo: doc.data().cargo
        }));

        // Filtra colaboradores por cargo
        const analistas = colaboradoresData.filter(col => col.cargo === 'Analista');
        const desenvolvedores = colaboradoresData.filter(col => col.cargo === 'Desenvolvedor');
        const supervisores = colaboradoresData.filter(col => col.cargo === 'Supervisor');

        setColaboradoresFB({
          analistas,
          desenvolvedores,
          supervisores
        });

        console.log('Colaboradores carregados:', { analistas, desenvolvedores, supervisores }); // Para debug
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      }
    };

    fetchColaboradores();
  }, []); // Array vazio significa que será executado apenas uma vez ao montar o componente

  // Modifique o useEffect que busca os projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projetos'));
        const projetosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Projetos carregados:', projetosData); // Para debug
        setProjetos(projetosData);
        setProjetosFiltrados(projetosData); // Atualiza também os projetos filtrados
      } catch (error) {
        console.error('Erro ao buscar projetos:', error);
      }
    };

    fetchProjetos();
  }, []); // Array vazio significa que será executado apenas uma vez ao montar o componente

  // Adicione a função limparFiltros
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

  // Atualize o useEffect para aplicar filtros quando os projetos ou filtros mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [projetos, filtros]);

  // Adicione esta função antes do return do componente
  const exportToExcel = () => {
    try {
      // Prepara os dados para exportação
      const data = projetos.map(projeto => ({
        'ID': projeto.id,
        'Nome': projeto.nome,
        'Tipo': projeto.tipo || 'Não definido',
        'Status': projeto.status || 'Não definido',
        'Cliente': projeto.cliente || 'Não definido',
        'Email Cliente': projeto.contatoCliente?.email || 'Não definido',
        'Telefone Cliente': projeto.contatoCliente?.telefone || 'Não definido',
        'Analista Principal': projeto.analistaPrincipal?.map(a => a.label).join(', ') || 'Não definido',
        'Analista Backup': projeto.analistaBackup?.map(a => a.label).join(', ') || 'Não definido',
        'Desenvolvedor Principal': projeto.desenvolvedorPrincipal?.map(d => d.label).join(', ') || 'Não definido',
        'Desenvolvedor Backup': projeto.desenvolvedorBackup?.map(d => d.label).join(', ') || 'Não definido',
        'Supervisor Principal': projeto.supervisorPrincipal?.map(s => s.label).join(', ') || 'Não definido',
        'Supervisor Backup': projeto.supervisorBackup?.map(s => s.label).join(', ') || 'Não definido',
        'Data Criação': projeto.dataCriacao ? format(new Date(projeto.dataCriacao), 'dd/MM/yyyy HH:mm') : 'Não definido',
        'Total Tarefas': Object.values(projeto.kanban || {}).flat().length,
        'Tarefas A Definir': projeto.kanban?.aDefinir?.length || 0,
        'Tarefas A Fazer': projeto.kanban?.todo?.length || 0,
        'Tarefas Em Andamento': projeto.kanban?.inProgress?.length || 0,
        'Tarefas Em Teste': projeto.kanban?.testing?.length || 0,
        'Tarefas Pronto Deploy': projeto.kanban?.prontoDeploy?.length || 0,
        'Tarefas Concluídas': projeto.kanban?.done?.length || 0,
        'Tarefas Arquivadas': projeto.kanban?.arquivado?.length || 0,
      }));

      // Cria uma nova planilha
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projetos");

      // Ajusta a largura das colunas
      const colWidths = [
        { wch: 10 },  // ID
        { wch: 30 },  // Nome
        { wch: 15 },  // Tipo
        { wch: 15 },  // Status
        { wch: 30 },  // Cliente
        { wch: 30 },  // Email Cliente
        { wch: 20 },  // Telefone Cliente
        { wch: 30 },  // Analista Principal
        { wch: 30 },  // Analista Backup
        { wch: 30 },  // Desenvolvedor Principal
        { wch: 30 },  // Desenvolvedor Backup
        { wch: 30 },  // Supervisor Principal
        { wch: 30 },  // Supervisor Backup
        { wch: 20 },  // Data Criação
        { wch: 15 },  // Total Tarefas
        { wch: 15 },  // Tarefas A Definir
        { wch: 15 },  // Tarefas A Fazer
        { wch: 15 },  // Tarefas Em Andamento
        { wch: 15 },  // Tarefas Em Teste
        { wch: 15 },  // Tarefas Pronto Deploy
        { wch: 15 },  // Tarefas Concluídas
        { wch: 15 },  // Tarefas Arquivadas
      ];
      ws['!cols'] = colWidths;

      // Gera o arquivo e faz o download
      const fileName = `projetos_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar os dados. Por favor, tente novamente.');
    }
  };

  return (
    <div className="projetos-container">
      <Sidebar />
      <div className="projetos-content">
        <div className="header-with-button">
          <h1 className="page-title">Projetos</h1>
          <div className="header-buttons">
            <button className="export-button" onClick={exportToExcel}>
              <FontAwesomeIcon icon={faFileExcel} />
              Exportar para Excel
            </button>
            <button className="new-project-btn" onClick={handleNewProject}>
              <FontAwesomeIcon icon={faPlus} />
              Novo Projeto
            </button>
          </div>
        </div>

        {renderFiltros()}

        <div className="projects-grid">
          {projetosFiltrados.map((projeto) => projeto && (
            <div
              key={projeto.id}
              className={`project-card ${projeto.id === selectedProject?.id ? "selected" : ""}`}
              onClick={() => projeto.id && handleCardClick(projeto)}
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
                      <span>
                        {Array.isArray(projeto.analistaPrincipal) 
                          ? projeto.analistaPrincipal.map(a => a.label).join(', ')
                          : ''}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Desenvolvedor:</span>
                      <span>
                        {Array.isArray(projeto.desenvolvedorPrincipal)
                          ? projeto.desenvolvedorPrincipal.map(d => d.label).join(', ')
                          : ''}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Supervisor:</span>
                      <span>
                        {Array.isArray(projeto.supervisorPrincipal)
                          ? projeto.supervisorPrincipal.map(s => s.label).join(', ')
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="project-status">
                <span className={`status-badge status-${projeto.status?.toLowerCase()}`}>
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
                    <FontAwesomeIcon icon={faProjectDiagram} className="form-icon" />
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="SAC">SAC</option>
                    <option value="OL">OL</option>
                    <option value="PSP">PSP</option>
                    <option value="Interno">Interno</option>
                    <option value="Outro">Outro</option>
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
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
                    value={formData.contatoCliente.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contatoCliente: {
                        ...formData.contatoCliente,
                        email: e.target.value,
                      },
                    })}
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
                    onChange={(e) => setFormData({
                      ...formData,
                      contatoCliente: {
                        ...formData.contatoCliente,
                        telefone: e.target.value,
                      },
                    })}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  {isEditing && (
                    <button type="button" className="delete-btn" onClick={handleDeleteFromModal}>
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
              <p>Tem certeza que deseja excluir o projeto "{projetoToDelete?.nome}"?</p>
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setProjetoToDelete(null);
                    setIsModalOpen(true);
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

        {/* Modal de Feedback */}
        {feedbackModal.isOpen && (
          <div className="modal-overlay">
            <div className={`modal-content feedback-modal ${feedbackModal.type}`}>
              <div className="feedback-icon">
                {feedbackModal.type === 'success' ? (
                  <i className="material-icons">check_circle</i>
                ) : (
                  <i className="material-icons">error</i>
                )}
              </div>
              <p>{feedbackModal.message}</p>
              <button 
                className="ok-btn"
                onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projetos;
