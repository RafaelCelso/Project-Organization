import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import './Colaboradores.css';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDoc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import Select from 'react-select';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

function Colaboradores() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [colaboradorToDelete, setColaboradorToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    cargo: '',
    status: '',
    projeto: [],
    createdAt: '',
    updatedAt: ''
  });

  const [filtros, setFiltros] = useState({
    nome: '',
    cargo: '',
    status: '',
    projeto: ''
  });

  const [projetos, setProjetos] = useState([]);

  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    message: '',
    type: '' // 'success' ou 'error'
  });

  const OPCOES_CARGO = [
    { value: '', label: 'Todos os cargos' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Analista', label: 'Analista' },
    { value: 'Desenvolvedor', label: 'Desenvolvedor' }
  ];

  const OPCOES_STATUS = [
    { value: '', label: 'Todos os status' },
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
    { value: 'Férias', label: 'Férias' }
  ];

  const colaboradoresFiltrados = colaboradores
    .filter(colaborador => {
      return (
        colaborador.nome.toLowerCase().includes(filtros.nome.toLowerCase()) &&
        (filtros.cargo === '' || colaborador.cargo === filtros.cargo) &&
        (filtros.status === '' || colaborador.status === filtros.status) &&
        (filtros.projeto === '' || 
          (Array.isArray(colaborador.projeto) && 
           colaborador.projeto.includes(filtros.projeto)))
      );
    })
    .sort((a, b) => {
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'projeto') {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleProjetoChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prevState => ({
      ...prevState,
      projeto: selectedValues
    }));
  };

  const handleEdit = (colaborador) => {
    const colaboradorFormatado = {
      ...colaborador,
      projeto: Array.isArray(colaborador.projeto) ? colaborador.projeto : [],
      createdAt: colaborador.createdAt || '',
      updatedAt: colaborador.updatedAt || ''
    };
    
    setIsEditing(true);
    setFormData(colaboradorFormatado);
    setIsModalOpen(true);
  };

  const handleDelete = (colaborador) => {
    if (!colaborador || !colaborador.id) {
      console.error("Colaborador inválido:", colaborador);
      return;
    }
    setColaboradorToDelete(colaborador);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!colaboradorToDelete) {
        console.error("Colaborador não selecionado para exclusão");
        return;
      }

      console.log("Tentando excluir colaborador:", colaboradorToDelete);

      // Remover o colaborador dos projetos primeiro
      const projetosRef = collection(db, 'projetos');
      const projetosSnapshot = await getDocs(projetosRef);
      
      const atualizacoesProjetos = [];
      
      projetosSnapshot.forEach(projetoDoc => {
        const projeto = projetoDoc.data();
        let precisaAtualizar = false;
        const atualizacao = {};

        // Verificar e remover de analistaPrincipal
        if (projeto.analistaPrincipal?.[0]?.value === colaboradorToDelete.id) {
          atualizacao.analistaPrincipal = [];
          precisaAtualizar = true;
        }

        // Verificar e remover de desenvolvedorPrincipal
        if (projeto.desenvolvedorPrincipal?.[0]?.value === colaboradorToDelete.id) {
          atualizacao.desenvolvedorPrincipal = [];
          precisaAtualizar = true;
        }

        // Verificar e remover de supervisorPrincipal
        if (projeto.supervisorPrincipal?.[0]?.value === colaboradorToDelete.id) {
          atualizacao.supervisorPrincipal = [];
          precisaAtualizar = true;
        }

        if (precisaAtualizar) {
          const projetoRef = doc(db, 'projetos', projetoDoc.id);
          atualizacoesProjetos.push(updateDoc(projetoRef, atualizacao));
        }
      });

      // Aguardar todas as atualizações dos projetos
      if (atualizacoesProjetos.length > 0) {
        await Promise.all(atualizacoesProjetos);
      }

      // Agora excluir o colaborador
      const colaboradorRef = doc(db, 'colaboradores', colaboradorToDelete.id);
      await deleteDoc(colaboradorRef);
      
      // Atualizar o estado local
      setColaboradores(prevColaboradores => 
        prevColaboradores.filter(col => col.id !== colaboradorToDelete.id)
      );
      
      setIsDeleteModalOpen(false);
      setColaboradorToDelete(null);
      
      // Recarregar a lista de colaboradores
      await loadColaboradores();
      
      setFeedbackModal({
        isOpen: true,
        message: "Colaborador excluído com sucesso!",
        type: 'success'
      });
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      console.error("Detalhes do erro:", {
        colaborador: colaboradorToDelete,
        erro: error.message
      });
      setFeedbackModal({
        isOpen: true,
        message: "Erro ao excluir colaborador. Por favor, tente novamente.",
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const now = new Date().toISOString();
      
      // Se estiver editando, buscar os projetos atuais do colaborador
      let projetosAtuais = [];
      if (isEditing && formData.id) {
        const colaboradorRef = doc(db, 'colaboradores', formData.id);
        const colaboradorDoc = await getDoc(colaboradorRef);
        if (colaboradorDoc.exists()) {
          projetosAtuais = colaboradorDoc.data().projeto || [];
        }
      }
      
      const colaboradorData = {
        nome: formData.nome,
        cargo: formData.cargo,
        status: formData.status,
        projeto: projetosAtuais, // Mantém os projetos existentes
        createdAt: isEditing ? formData.createdAt : now,
        updatedAt: now
      };

      const colaboradoresRef = collection(db, 'colaboradores');
      
      if (isEditing && formData.id) {
        const docRef = doc(db, 'colaboradores', formData.id);
        await updateDoc(docRef, {
          ...colaboradorData,
          createdAt: formData.createdAt
        });
      } else {
        await addDoc(colaboradoresRef, colaboradorData);
      }

      handleCloseModal();
      await loadColaboradores();
      setFeedbackModal({
        isOpen: true,
        message: isEditing ? "Colaborador atualizado com sucesso!" : "Colaborador criado com sucesso!",
        type: 'success'
      });
    } catch (error) {
      console.error("Erro ao salvar colaborador:", error);
      setFeedbackModal({
        isOpen: true,
        message: "Erro ao salvar colaborador. Por favor, tente novamente.",
        type: 'error'
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({
      id: null,
      nome: '',
      cargo: '',
      status: '',
      projeto: [],
      createdAt: '',
      updatedAt: ''
    });
  };

  const handleNewColaborador = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nome: '',
      cargo: '',
      status: '',
      projeto: [],
      createdAt: '',
      updatedAt: ''
    });
    setIsModalOpen(true);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFiltroProjetoChange = (selectedOption) => {
    setFiltros(prev => ({
      ...prev,
      projeto: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleFiltroCargoChange = (selectedOption) => {
    setFiltros(prev => ({
      ...prev,
      cargo: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleFiltroStatusChange = (selectedOption) => {
    setFiltros(prev => ({
      ...prev,
      status: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleLimparFiltros = () => {
    setFiltros({
      nome: '',
      cargo: '',
      status: '',
      projeto: ''
    });
    
    // Forçar o reset do estado interno dos componentes Select
    const event = new Event('change');
    document.querySelectorAll('.react-select__clear-indicator').forEach(button => {
      button.dispatchEvent(event);
    });
  };

  const loadColaboradores = async () => {
    try {
      setIsLoading(true);
      
      // Primeiro, buscar todos os projetos
      const projetosRef = collection(db, 'projetos');
      const projetosSnapshot = await getDocs(projetosRef);
      
      // Criar um mapa de colaboradores e seus projetos
      const colaboradoresProjetos = new Map();
      
      projetosSnapshot.forEach(doc => {
        const projeto = doc.data();
        const projetoNome = projeto.nome;

        // Verificar analista principal
        if (projeto.analistaPrincipal?.[0]) {
          const colaboradorId = projeto.analistaPrincipal[0].value;
          if (!colaboradoresProjetos.has(colaboradorId)) {
            colaboradoresProjetos.set(colaboradorId, new Set());
          }
          colaboradoresProjetos.get(colaboradorId).add(projetoNome);
        }

        // Verificar desenvolvedor principal
        if (projeto.desenvolvedorPrincipal?.[0]) {
          const colaboradorId = projeto.desenvolvedorPrincipal[0].value;
          if (!colaboradoresProjetos.has(colaboradorId)) {
            colaboradoresProjetos.set(colaboradorId, new Set());
          }
          colaboradoresProjetos.get(colaboradorId).add(projetoNome);
        }

        // Verificar supervisor principal
        if (projeto.supervisorPrincipal?.[0]) {
          const colaboradorId = projeto.supervisorPrincipal[0].value;
          if (!colaboradoresProjetos.has(colaboradorId)) {
            colaboradoresProjetos.set(colaboradorId, new Set());
          }
          colaboradoresProjetos.get(colaboradorId).add(projetoNome);
        }
      });

      // Agora buscar os colaboradores
      const colaboradoresRef = collection(db, 'colaboradores');
      const colaboradoresSnapshot = await getDocs(colaboradoresRef);
      
      const atualizacoes = [];
      const colaboradoresData = [];

      // Processar cada colaborador
      for (const doc of colaboradoresSnapshot.docs) {
        const colaborador = {
          id: doc.id,
          ...doc.data()
        };

        // Verificar se o colaborador está associado a algum projeto
        const projetosDoColaborador = colaboradoresProjetos.get(doc.id);
        
        if (projetosDoColaborador && projetosDoColaborador.size > 0) {
          // Colaborador tem projetos - atualizar com a lista de projetos
          const projetosAtualizados = Array.from(projetosDoColaborador).sort();
          colaborador.projeto = projetosAtualizados;
          
          // Adicionar atualização ao lote
          atualizacoes.push(
            updateDoc(doc.ref, { 
              projeto: projetosAtualizados,
              updatedAt: new Date().toISOString()
            })
          );
        } else {
          // Colaborador não tem projetos - limpar o array de projetos
          colaborador.projeto = [];
          
          // Adicionar atualização ao lote
          atualizacoes.push(
            updateDoc(doc.ref, { 
              projeto: [],
              updatedAt: new Date().toISOString()
            })
          );
        }

        colaboradoresData.push(colaborador);
      }

      // Executar todas as atualizações em lote
      if (atualizacoes.length > 0) {
        await Promise.all(atualizacoes);
      }

      // Atualizar o estado com os dados processados
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
      alert("Erro ao carregar colaboradores. Por favor, recarregue a página.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadColaboradores();
  }, []);

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const projetosRef = collection(db, 'projetos');
        const snapshot = await getDocs(projetosRef);
        const projetosData = snapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome
        }));
        setProjetos(projetosData);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      }
    };

    fetchProjetos();
  }, []);

  const exportToExcel = () => {
    try {
      // Prepara os dados para exportação
      const data = colaboradores.map(colaborador => ({
        'ID': colaborador.id,
        'Nome': colaborador.nome,
        'Cargo': colaborador.cargo || 'Não definido',
        'Status': colaborador.status || 'Não definido',
        'Projetos': Array.isArray(colaborador.projeto) 
          ? colaborador.projeto.sort().join(', ') 
          : 'Nenhum projeto',
        'Data Criação': colaborador.createdAt 
          ? format(new Date(colaborador.createdAt), 'dd/MM/yyyy HH:mm')
          : 'Não definido',
        'Última Atualização': colaborador.updatedAt
          ? format(new Date(colaborador.updatedAt), 'dd/MM/yyyy HH:mm')
          : 'Não definido'
      }));

      // Cria uma nova planilha
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");

      // Ajusta a largura das colunas
      const colWidths = [
        { wch: 10 },  // ID
        { wch: 30 },  // Nome
        { wch: 15 },  // Cargo
        { wch: 15 },  // Status
        { wch: 50 },  // Projetos
        { wch: 20 },  // Data Criação
        { wch: 20 },  // Última Atualização
      ];
      ws['!cols'] = colWidths;

      // Gera o arquivo e faz o download
      const fileName = `colaboradores_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar os dados. Por favor, tente novamente.');
    }
  };

  return (
    <div className="colaboradores-container">
      <Sidebar />
      <div className="colaboradores-content">
        <div className="header-with-button">
          <h1 className="page-title">Colaboradores</h1>
          <div className="header-buttons">
            <button className="export-button" onClick={exportToExcel}>
              <FontAwesomeIcon icon={faFileExcel} />
              Exportar para Excel
            </button>
            <button 
              className="new-colaborador-btn"
              onClick={handleNewColaborador}
            >
              <FontAwesomeIcon icon={faPlus} />
              Novo Colaborador
            </button>
          </div>
        </div>

        <div className="filtros-section">
          <div className="filtros-container">
            <div className="filtros-linha">
              <div className="filtro-grupo filtro-nome">
                <label>Nome</label>
                <div className="busca-input-container">
                  <i className="material-icons busca-icon">search</i>
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    name="nome"
                    value={filtros.nome}
                    onChange={handleFiltroChange}
                  />
                </div>
              </div>
            </div>

            <div className="filtros-linha">
              <div className="filtro-grupo">
                <label>Cargo</label>
                <Select
                  value={OPCOES_CARGO.find(opt => opt.value === filtros.cargo)}
                  onChange={handleFiltroCargoChange}
                  options={OPCOES_CARGO}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Selecione"
                  isClearable
                />
              </div>

              <div className="filtro-grupo">
                <label>Status</label>
                <Select
                  value={OPCOES_STATUS.find(opt => opt.value === filtros.status)}
                  onChange={handleFiltroStatusChange}
                  options={OPCOES_STATUS}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Selecione"
                  isClearable
                />
              </div>

              <div className="filtro-grupo">
                <label>Projeto</label>
                <Select
                  value={filtros.projeto ? { value: filtros.projeto, label: filtros.projeto } : null}
                  onChange={handleFiltroProjetoChange}
                  options={[
                    { value: '', label: 'Todos os projetos' },  // Adicionar opção default
                    ...projetos
                      .map(projeto => ({
                        value: projeto.nome,
                        label: projeto.nome
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }))
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
            onClick={handleLimparFiltros}
          >
            <i className="material-icons">clear</i>
            Limpar Filtros
          </button>
        </div>

        <div className="colaboradores-grid">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando colaboradores...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Projeto</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {colaboradoresFiltrados.map(colaborador => (
                  <tr key={colaborador.id}>
                    <td>{colaborador.nome}</td>
                    <td>{colaborador.cargo}</td>
                    <td className="projetos-cell">
                      {Array.isArray(colaborador.projeto) 
                        ? colaborador.projeto.sort().join(', ') 
                        : ''}
                    </td>
                    <td className={`status-${colaborador.status.toLowerCase()}`}>
                      {colaborador.status}
                    </td>
                    <td className="acoes-column">
                      <button 
                        className="icon-button edit-btn"
                        onClick={() => handleEdit(colaborador)}
                        title="Editar"
                      >
                        <i className="material-icons">create</i>
                      </button>
                      <button 
                        className="icon-button delete-btn"
                        onClick={() => handleDelete(colaborador)}
                        title="Excluir"
                      >
                        <i className="material-icons">delete_outline</i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="close-modal-btn"
                onClick={handleCloseModal}
                type="button"
              >
                ×
              </button>
              <h2>{isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nome">Nome</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cargo">Cargo</label>
                  <select
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Analista">Analista</option>
                    <option value="Desenvolvedor">Desenvolvedor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Férias">Férias</option>
                  </select>
                </div>

                <div className="modal-buttons">
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && colaboradorToDelete && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o colaborador "{colaboradorToDelete.nome}"?</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setColaboradorToDelete(null);
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

export default Colaboradores; 