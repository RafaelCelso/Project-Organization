import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import './Colaboradores.css';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import Select from 'react-select';

function Colaboradores() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [colaboradorToDelete, setColaboradorToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [colaboradores, setColaboradores] = useState([
    {
      id: 1,
      nome: "Ana Silva",
      cargo: "Analista",
      status: "Ativo",
      projeto: "Projeto A"
    }
  ]);
  
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    cargo: '',
    status: '',
    projeto: []
  });

  const [filtros, setFiltros] = useState({
    nome: '',
    cargo: '',
    status: '',
    projeto: ''
  });

  const [projetos, setProjetos] = useState([]);

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
        (filtros.projeto === '' || (Array.isArray(colaborador.projeto) && 
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
      projeto: Array.isArray(colaborador.projeto) ? colaborador.projeto : []
    };
    
    setIsEditing(true);
    setFormData(colaboradorFormatado);
    setIsModalOpen(true);
  };

  const handleDelete = (colaborador) => {
    setColaboradorToDelete(colaborador);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const colaboradorRef = doc(db, 'colaboradores', colaboradorToDelete.id);
      await deleteDoc(colaboradorRef);
      
      setColaboradores(colaboradores.filter(col => col.id !== colaboradorToDelete.id));
      setIsDeleteModalOpen(false);
      setColaboradorToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      // Aqui você pode adicionar uma notificação de erro para o usuário
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const colaboradorData = {
        nome: formData.nome,
        cargo: formData.cargo,
        status: formData.status,
        projeto: Array.isArray(formData.projeto) ? formData.projeto : [],
        updatedAt: new Date().toISOString()
      };

      if (isEditing && formData.id) {
        const colaboradorRef = doc(db, 'colaboradores', formData.id);
        await updateDoc(colaboradorRef, colaboradorData);

        setColaboradores(prevColaboradores => 
          prevColaboradores.map(colaborador => 
            colaborador.id === formData.id 
              ? { ...colaborador, ...colaboradorData }
              : colaborador
          )
        );
      } else {
        const colaboradoresRef = collection(db, 'colaboradores');
        const docRef = await addDoc(colaboradoresRef, {
          ...colaboradorData,
          createdAt: new Date().toISOString()
        });

        const novoColaborador = {
          id: docRef.id,
          ...colaboradorData
        };
        
        setColaboradores(prevColaboradores => [...prevColaboradores, novoColaborador]);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar colaborador:", error);
      alert("Erro ao salvar colaborador. Por favor, tente novamente.");
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
      projeto: []
    });
  };

  const handleNewColaborador = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nome: '',
      cargo: '',
      status: '',
      projeto: []
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

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const colaboradoresRef = collection(db, 'colaboradores');
        const snapshot = await getDocs(colaboradoresRef);
        const colaboradoresData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          projeto: Array.isArray(doc.data().projeto) ? doc.data().projeto : []
        }));
        setColaboradores(colaboradoresData);
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
        alert("Erro ao carregar colaboradores. Por favor, recarregue a página.");
      }
    };

    fetchColaboradores();
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

  return (
    <div className="colaboradores-container">
      <Sidebar />
      <div className="colaboradores-content">
        <div className="header-with-button">
          <h1 className="page-title">Colaboradores</h1>
          <button 
            className="new-colaborador-btn"
            onClick={handleNewColaborador}
          >
            Novo Colaborador
          </button>
        </div>

        <div className="filtros-section">
          <div className="filtro-grupo">
            <label htmlFor="filtro-nome">Nome</label>
            <input
              id="filtro-nome"
              type="text"
              placeholder="Buscar por nome..."
              name="nome"
              value={filtros.nome}
              onChange={handleFiltroChange}
              className="filtro-input"
            />
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="filtro-cargo">Cargo</label>
            <Select
              id="filtro-cargo"
              name="cargo"
              value={OPCOES_CARGO.find(opt => opt.value === filtros.cargo)}
              onChange={handleFiltroCargoChange}
              options={OPCOES_CARGO}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione um cargo..."
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label htmlFor="filtro-status">Status</label>
            <Select
              id="filtro-status"
              name="status"
              value={OPCOES_STATUS.find(opt => opt.value === filtros.status)}
              onChange={handleFiltroStatusChange}
              options={OPCOES_STATUS}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione um status..."
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label htmlFor="filtro-projeto">Projeto</label>
            <Select
              id="filtro-projeto"
              name="projeto"
              value={projetos
                .filter(p => p.nome === filtros.projeto)
                .map(p => ({ value: p.nome, label: p.nome }))[0]}
              onChange={handleFiltroProjetoChange}
              options={[
                { value: '', label: 'Todos os projetos' },
                ...projetos
                  .map(projeto => ({
                    value: projeto.nome,
                    label: projeto.nome
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }))
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione um projeto..."
              isClearable
            />
          </div>
        </div>

        <div className="colaboradores-grid">
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
                      ? colaborador.projeto.join(', ') 
                      : colaborador.projeto}
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

                <div className="form-group">
                  <label htmlFor="projeto">Projetos</label>
                  <Select
                    isMulti
                    name="projeto"
                    options={projetos
                      .map(projeto => ({
                        value: projeto.nome,
                        label: projeto.nome
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }))
                    }
                    value={formData.projeto.map(proj => ({
                      value: proj,
                      label: proj
                    }))}
                    onChange={handleProjetoChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Selecione os projetos..."
                    noOptionsMessage={() => "Nenhum projeto encontrado"}
                  />
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

        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o colaborador "{colaboradorToDelete?.nome}"?</p>
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
      </div>
    </div>
  );
}

export default Colaboradores; 