import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faClipboardList, faUser, faCalendarAlt, faExclamationTriangle, faSpinner, faCheckCircle, faProjectDiagram, faComment, faImage, faDownload, faSearch, faFilter, faTimes, faTag, faTrash, faHistory } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import './Tarefas.css';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom'; // Adicione este import
import { db } from './firebaseConfig'; // Ao invés de '../firebase'
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import Select from 'react-select';

const initialTasks = {
  todo: [
    { 
      id: '1', 
      titulo: 'Implementar Login',
      content: 'Implementar nova feature de login com autenticação', 
      projeto: 'Projeto A', 
      responsavel: 'João Santos' 
    },
    { 
      id: '2', 
      titulo: 'Corrigir Bug #123',
      content: 'Corrigir bug no login de usuários', 
      projeto: 'Projeto B', 
      responsavel: 'Ana Silva' 
    },
  ],
  inProgress: [
    { 
      id: '3', 
      titulo: 'Desenvolver API',
      content: 'Desenvolver API REST para integração', 
      projeto: 'Projeto A', 
      responsavel: 'Maria Oliveira' 
    },
  ],
  testing: [
    { 
      id: '4', 
      titulo: 'Testes de Integração',
      content: 'Testar integração com novo sistema', 
      projeto: 'Projeto C', 
      responsavel: 'Pedro Costa' 
    },
  ],
  done: [
    { 
      id: '5', 
      titulo: 'Atualizar Docs',
      content: 'Atualizar documentação do sistema', 
      projeto: 'Projeto B', 
      responsavel: 'Lucas Mendes' 
    },
  ],
};

const tagColors = [
  { id: 1, cor: '#e53935', nome: 'Vermelho' },
  { id: 2, cor: '#8e24aa', nome: 'Roxo' },
  { id: 3, cor: '#1e88e5', nome: 'Azul' },
  { id: 4, cor: '#43a047', nome: 'Verde' },
  { id: 5, cor: '#fb8c00', nome: 'Laranja' },
  { id: 6, cor: '#00acc1', nome: 'Ciano' },
  { id: 7, cor: '#3949ab', nome: 'Índigo' },
  { id: 8, cor: '#fdd835', nome: 'Amarelo' },
];

function Tarefas() {
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [projetos, setProjetos] = useState([]);

  const [tasks, setTasks] = useState({
    aDefinir: [],
    todo: [],
    inProgress: [],
    testing: [],
    prontoDeploy: [],
    done: [],
    arquivado: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false);
  const [isEditStageModalOpen, setIsEditStageModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [stagePosition, setStagePosition] = useState(0);
  const [editingStage, setEditingStage] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    taskId: '',
    titulo: '',
    content: '',
    projeto: '',
    responsavel: '',
    status: 'aDefinir',
    dataInicio: '',
    dataConclusao: '',
    prioridade: 'baixa', // Define prioridade baixa como padrão
    progresso: 'nao_iniciada',
    imagens: [],
    tags: [],
    numeroChamado: ''
  });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentarios, setComentarios] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [lastTaskId, setLastTaskId] = useState(5); // Começa do 5 já que temos tarefas iniciais
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [filtros, setFiltros] = useState({
    busca: '',
    tipoBusca: 'nome',
    prioridade: '',
    dataInicio: '',
    dataFim: '',
    tag: ''
  });
  const [tarefasFiltradas, setTarefasFiltradas] = useState(null);
  const [isDeleteStageModalOpen, setIsDeleteStageModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);
  const [novaTag, setNovaTag] = useState('');
  const [corSelecionada, setCorSelecionada] = useState(tagColors[0].cor);
  const [showTagInput, setShowTagInput] = useState(false);

  // Adicionar estado para armazenar todas as tags disponíveis
  const [availableTags, setAvailableTags] = useState([
    // Tags iniciais de exemplo
    { id: 1, texto: 'Bug', cor: '#e53935' },
    { id: 2, texto: 'Feature', cor: '#43a047' },
    { id: 3, texto: 'Melhoria', cor: '#1e88e5' },
    { id: 4, texto: 'Urgente', cor: '#fb8c00' }
  ]);

  // Adicione estes estados
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Adicione estes estados
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [selectedProjectsToAdd, setSelectedProjectsToAdd] = useState([]);

  // Adicione esta lista de projetos disponíveis (você pode pegar do backend depois)
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Adicione estes estados
  const [filtrosProjetos, setFiltrosProjetos] = useState({
    busca: '',
    tipo: '',
    analista: '',
    desenvolvedor: ''
  });
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);

  // Primeiro, adicione um novo estado para controlar as guias do modal
  const [activeTab, setActiveTab] = useState('detalhes');

  // Adicione um estado para armazenar o log da tarefa
  const [taskLog, setTaskLog] = useState([]);

  // Adicione este estado no início do componente
  const [responsaveis, setResponsaveis] = useState([]);

  // Adicione um estado para controlar a validação
  const [showValidation, setShowValidation] = useState(false);

  // Estados para o novo modal
  const [isArchivedTaskModalOpen, setIsArchivedTaskModalOpen] = useState(false);
  const [archivedTask, setArchivedTask] = useState(null);
  const [isConfirmDeleteArchivedTaskModalOpen, setIsConfirmDeleteArchivedTaskModalOpen] = useState(false);

  // Crie uma função auxiliar para converter o status
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'aDefinir':
        return 'A Definir';
      case 'todo':
        return 'A Fazer';
      case 'inProgress':
        return 'Em Andamento';
      case 'testing':
        return 'Em Teste';
      case 'prontoDeploy':
        return 'Pronto para Deploy';
      case 'done':
        return 'Concluído';
      case 'arquivado':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const handleAddComment = async () => {
    if (!comentario.trim() || !selectedTask) return;

    try {
      const novoComentario = {
        data: new Date().toISOString(),
        detalhes: comentario,
        tipo: "comentario",
        usuario: "Usuário Atual", // Substitua pelo usuário logado
        nome: "1234" // Substitua pelo nome do usuário logado
      };

      // Atualiza o log da tarefa no Firebase
      const projetoRef = doc(db, 'projetosTarefas', selectedProject.id);
      const novoKanban = { ...tasks };
      
      // Encontra a coluna e a tarefa
      Object.keys(novoKanban).forEach(coluna => {
        novoKanban[coluna] = novoKanban[coluna].map(task => {
          if (task.id === selectedTask.id) {
            return {
              ...task,
              log: [...(task.log || []), novoComentario]
            };
          }
          return task;
        });
      });

      // Atualiza o Firebase
      await updateDoc(projetoRef, {
        kanban: novoKanban
      });

      // Atualiza o estado local
      setTasks(novoKanban);
      
      // Atualiza o estado dos comentários
      setComentarios(prev => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), novoComentario]
      }));

      setComentario('');
      setShowCommentInput(false);

    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Por favor, tente novamente.');
    }
  };

  // Atualiza as tasks quando um projeto é selecionado
  const handleProjectSelect = (projeto) => {
    if (selectedProject?.id === projeto.id) {
      setSelectedProject(null);
      setTasks({
        aDefinir: [],
        todo: [],
        inProgress: [],
        testing: [],
        prontoDeploy: [],
        done: [],
        arquivado: []
      });
      return;
    }

    // Inicializa o projeto com todas as colunas necessárias
    const kanbanInicial = {
      aDefinir: [],
      todo: [],
      inProgress: [],
      testing: [],
      prontoDeploy: [],
      done: [],
      arquivado: []
    };

    // Mescla o kanban existente (se houver) com o kanban inicial
    const kanbanCompleto = projeto.kanban 
      ? { ...kanbanInicial, ...projeto.kanban }
      : kanbanInicial;

    // Atualiza o projeto selecionado com o kanban completo
    const projetoAtualizado = {
      ...projeto,
      kanban: kanbanCompleto
    };

    setSelectedProject(projetoAtualizado);
    setTasks(kanbanCompleto);

    // Atualiza o projeto na lista de projetos
    const updatedProjetos = projetos.map(p => 
      p.id === projeto.id ? projetoAtualizado : p
    );
    setProjetos(updatedProjetos);
  };

  // Atualiza o kanban do projeto quando as tasks são modificadas
  const updateProjectKanban = (newTasks) => {
    if (!selectedProject) return;

    const updatedProjetos = projetos.map(proj => {
      if (proj.id === selectedProject.id) {
        return {
          ...proj,
          kanban: { ...newTasks }
        };
      }
      return proj;
    });

    setProjetos(updatedProjetos);
    setTasks({ ...newTasks });
    setSelectedProject({
      ...selectedProject,
      kanban: { ...newTasks }
    });
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId &&
        source.index === destination.index) return;

    try {
      // Lógica para mover tarefas entre colunas
      const sourceColumn = Array.isArray(tasks[source.droppableId]) ? tasks[source.droppableId] : [];
      const destColumn = Array.isArray(tasks[destination.droppableId]) ? tasks[destination.droppableId] : [];
      
      const taskToMove = sourceColumn[source.index];
      
      const [removed] = sourceColumn.splice(source.index, 1);
      destColumn.splice(destination.index, 0, {
        ...removed,
        status: destination.droppableId,
        log: [
          ...(removed.log || []),
          {
            tipo: 'movimentacao',
            data: new Date().toISOString(),
            usuario: 'Usuário Atual',
            detalhes: `Movida de ${source.droppableId} para ${destination.droppableId}`
          }
        ]
      });

      const newState = {
        ...tasks,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn,
      };

      // Atualiza o Firebase
      const projetoRef = doc(db, 'projetosTarefas', selectedProject.id);
      await updateDoc(projetoRef, {
        kanban: newState
      });

      // Atualiza o estado local
      setTasks(newState);

    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      alert('Erro ao mover tarefa. Por favor, tente novamente.');
    }
  };

  // Adicione esta função para buscar o maior ID
  const getMaxTaskId = () => {
    let maxId = 0;
    
    // Verifica todas as colunas do kanban
    Object.values(tasks).forEach(column => {
      column.forEach(task => {
        if (task.taskId && typeof task.taskId === 'number') {
          maxId = Math.max(maxId, task.taskId);
        }
      });
    });
    
    return maxId;
  };

  // Modifique a função handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setShowValidation(true);
    
    if (!formData.titulo.trim()) {
      return;
    }

    try {
      // Busca o maior ID existente e incrementa
      const nextTaskId = getMaxTaskId() + 1;
      
      // Prepara os dados da tarefa
      const novaTarefa = {
        id: formData.id || `task-${Date.now()}`,
        taskId: nextTaskId, // Usa o novo ID calculado
        titulo: formData.titulo,
        content: formData.content || '',
        responsavel: formData.responsavel ? responsaveis
          .filter(resp => formData.responsavel.includes(resp.id))
          .map(resp => resp.nome) : [],
        dataInicio: formData.dataInicio || '',
        dataConclusao: formData.dataConclusao || '',
        prioridade: formData.prioridade || 'baixa', // Define prioridade baixa se não estiver definida
        progresso: formData.progresso || 'nao_iniciada',
        status: formData.status || 'aDefinir',
        numeroChamado: formData.numeroChamado || '',
        projetoId: selectedProject.id,
        nome: formData.titulo,
        tags: formData.tags || [],
        imagens: uploadedFiles || [],
        log: [
          {
            tipo: isEditing ? 'edicao' : 'criacao',
            data: new Date().toISOString(),
            usuario: 'Usuário Atual',
            detalhes: isEditing ? 'Tarefa editada' : 'Tarefa criada'
          }
        ]
      };

      // Referência para o documento do projeto
      const projetoRef = doc(db, 'projetosTarefas', selectedProject.id);

      if (isEditing) {
        // Atualiza a tarefa existente no Firebase
        const novoKanban = {
          ...tasks,
          [formData.status]: tasks[formData.status].map(task =>
            task.id === formData.id ? novaTarefa : task
          )
        };

        await updateDoc(projetoRef, {
          kanban: novoKanban
        });

        // Atualiza o estado local
        setTasks(novoKanban);

      } else {
        // Adiciona nova tarefa
        const novoKanban = {
          ...tasks,
          [formData.status]: [...(tasks[formData.status] || []), novaTarefa]
        };

        // Atualiza o documento no Firebase
        await updateDoc(projetoRef, {
          kanban: novoKanban
        });

        // Atualiza o estado local
        setTasks(novoKanban);
      }

      // Fecha o modal e limpa o formulário
      setIsModalOpen(false);
      clearFormAndImages();
      setShowValidation(false);

    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa. Por favor, tente novamente.');
    }
  };

  const handleAddTask = () => {
    setFormData({
      content: '',
      projeto: '',
      responsavel: '',
      status: 'todo'
    });
    setIsModalOpen(true);
  };

  const handleAddTaskToColumn = (status) => {
    setFormData({
      id: null,
      taskId: '',
      titulo: '',
      content: '',
      projeto: '',
      responsavel: '',
      status: status,
      dataInicio: '',
      dataConclusao: '',
      prioridade: '',
      progresso: 'nao_iniciada',
      tags: [],
      numeroChamado: '',
      imagens: []
    });
    setIsModalOpen(true);
  };

  const handleAddStage = () => {
    setIsNewStageModalOpen(true);
  };

  const handleSubmitNewStage = (e) => {
    e.preventDefault();
    const stageId = newStageName.toLowerCase().replace(/\s+/g, '_');
    
    // Cria um array com as chaves das colunas para manipular a ordem
    const columnKeys = Object.keys(tasks);
    
    // Insere na posição selecionada
    columnKeys.splice(stagePosition, 0, stageId);
    
    // Cria um novo objeto com as colunas reordenadas
    const newTasks = {};
    columnKeys.forEach(key => {
      if (key === stageId) {
        newTasks[stageId] = []; // Nova coluna vazia
      } else {
        newTasks[key] = tasks[key]; // Mantém as tarefas existentes
      }
    });

    // Atualiza o projeto selecionado com a nova etapa
    const updatedProjetos = projetos.map(proj => {
      if (proj.id === selectedProject.id) {
        return {
          ...proj,
          kanban: newTasks
        };
      }
      return proj;
    });

    setProjetos(updatedProjetos);
    setSelectedProject({
      ...selectedProject,
      kanban: newTasks
    });
    setTasks(newTasks);
    setIsNewStageModalOpen(false);
    setNewStageName('');
    setStagePosition(0);
  };

  const handleEditStage = (columnId, currentName) => {
    setEditingStage({
      id: columnId,
      name: currentName
    });
    setNewStageName(currentName);
    setIsEditStageModalOpen(true);
  };

  const handleSubmitEditStage = (e) => {
    e.preventDefault();
    const oldId = editingStage.id;
    const newId = newStageName.toLowerCase().replace(/\s+/g, '_');
    
    // Cria um novo objeto com as colunas atualizadas
    const newTasks = {};
    Object.keys(tasks).forEach(key => {
      if (key === oldId) {
        // Se for a coluna editada, usa o novo ID
        newTasks[newId] = tasks[oldId];
      } else {
        newTasks[key] = tasks[key];
      }
    });

    setTasks(newTasks);
    setIsEditStageModalOpen(false);
    setEditingStage(null);
    setNewStageName('');
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setFormData({
      id: task.id,
      titulo: task.titulo,
      content: task.content,
      projeto: task.projeto,
      responsavel: task.responsavel,
      dataInicio: task.dataInicio || '',
      dataConclusao: task.dataConclusao || '',
      prioridade: task.prioridade || '',
      progresso: task.progresso || 'nao_iniciada',
      status: task.status || 'todo'
    });
    
    // Carrega os comentários da tarefa
    setComentarios({
      [task.id]: task.log || []
    });
    
    setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
    handleEdit(selectedTask);
    setIsViewModalOpen(false);
  };

  const handleDeleteTask = () => {
    setTaskToDelete(selectedTask);
    setIsViewModalOpen(false);
    setIsDeleteTaskModalOpen(true);
  };

  const confirmDeleteTask = () => {
    const columnId = Object.keys(tasks).find(key => 
      tasks[key].some(task => task.id === taskToDelete.id)
    );

    if (columnId) {
      const taskToArchive = tasks[columnId].find(task => task.id === taskToDelete.id);
      const newState = {
        ...tasks,
        [columnId]: tasks[columnId].filter(task => task.id !== taskToDelete.id),
        arquivado: [...tasks.arquivado, {
          ...taskToArchive, 
          arquivadoEm: format(new Date(), 'yyyy-MM-dd')
        }]
      };

      updateProjectKanban(newState);
    }

    setIsDeleteTaskModalOpen(false);
    setTaskToDelete(null);
    setSelectedTask(null);
  };

  // Atualiza o contador de tarefas no card do projeto
  const getTotalTasks = (projeto) => {
    if (!projeto.kanban) return 0;
    return Object.values(projeto.kanban).reduce((acc, column) => acc + column.length, 0);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFiles(prev => [...prev, {
            id: Date.now(),
            url: reader.result,
            name: file.name,
            type: file.type
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Função para limpar o formulário e as imagens
  const clearFormAndImages = () => {
    setFormData({
      id: null,
      taskId: '',
      titulo: '',
      content: '',
      projeto: '',
      responsavel: '',
      status: 'aDefinir',
      dataInicio: '',
      dataConclusao: '',
      prioridade: 'baixa', // Define prioridade baixa como padrão
      progresso: 'nao_iniciada',
      imagens: [],
      tags: [],
      numeroChamado: ''
    });
    setUploadedFiles([]); // Limpa as imagens
    setActiveTab('detalhes'); // Volta para a aba de detalhes
    setTaskLog([]); // Limpa o log
    setIsEditing(false); // Reseta o modo de edição
    setShowValidation(false); // Reseta a validação
  };

  const handleEdit = (task) => {
    setIsEditing(true);
    
    // Converte os responsáveis da tarefa em objetos compatíveis com o React Select
    const responsaveisSelecionados = Array.isArray(task.responsavel) 
      ? task.responsavel.map(nome => {
          const resp = responsaveis.find(r => r.nome === nome);
          return resp ? resp.id : null;
        }).filter(id => id !== null)
      : [];

    setFormData({
      ...formData,
      id: task.id,
      titulo: task.titulo,
      content: task.content,
      responsavel: responsaveisSelecionados,
      dataInicio: task.dataInicio || '',
      dataConclusao: task.dataConclusao || '',
      prioridade: task.prioridade || '',
      progresso: task.progresso || 'nao_iniciada',
      status: task.status || 'todo',
      numeroChamado: task.numeroChamado || '',
      tags: task.tags || [] // Adiciona as tags existentes ao formData
    });

    // Carrega as imagens existentes
    if (task.imagens && task.imagens.length > 0) {
      setUploadedFiles(task.imagens.map(imagem => ({
        id: imagem.id || Date.now(),
        url: imagem.url,
        name: imagem.name,
        type: imagem.type
      })));
    } else {
      setUploadedFiles([]);
    }
    
    setIsModalOpen(true);
  };

  // Adicione esta função para fazer o download da imagem
  const handleDownloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'imagem.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Atualizar o renderFormFields para o formulário simplificado
  const renderFormFields = () => {
    // Verifica se é uma tarefa em "A Definir"
    const isADefinirTask = formData.status === 'aDefinir';

    if (isADefinirTask) {
      return (
        <div className="simplified-form">
          <div className="form-group">
            <label htmlFor="numeroChamado">
              <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Número do Chamado
            </label>
            <input
              type="text"
              id="numeroChamado"
              value={formData.numeroChamado}
              onChange={(e) => setFormData({...formData, numeroChamado: e.target.value})}
              placeholder="Digite o número do chamado"
              className="simplified-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="titulo">
              <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Título
            </label>
            <input
              type="text"
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              required
              placeholder="Digite um título para a tarefa"
              className="simplified-input"
            />
          </div>

          <div className="form-group description">
            <label htmlFor="content">
              <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Descrição
            </label>
            <div className="description-container">
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
                placeholder="Descreva os detalhes da tarefa"
                className="simplified-textarea"
              />
              
              <div className="upload-section">
                <label htmlFor="file-upload" className="upload-btn simplified">
                  <FontAwesomeIcon icon={faImage} /> Adicionar imagem
                </label>
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="uploaded-files simplified">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="uploaded-file">
                      <img src={file.url} alt={file.name} />
                      <button 
                        className="remove-file-btn"
                        onClick={() => removeFile(file.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção de Tags */}
          <div className="form-group tags-section">
            <label>
              <FontAwesomeIcon icon={faTag} className="form-icon" /> Tags
            </label>
            <div className="tags-container simplified">
              {formData.tags?.map(tag => (
                <span 
                  key={tag.id} 
                  className="tag" 
                  style={{ backgroundColor: tag.cor }}
                >
                  {tag.texto}
                  <button 
                    type="button"
                    className="remove-tag-btn"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
              
              {!showTagInput ? (
                <div className="tags-actions simplified">
                  <select
                    className="existing-tags-select simplified"
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedTag = availableTags.find(tag => tag.id === parseInt(e.target.value));
                        if (selectedTag && !formData.tags?.find(tag => tag.id === selectedTag.id)) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...(prev.tags || []), selectedTag]
                          }));
                        }
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Selecionar tag existente...</option>
                    {availableTags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.texto}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    type="button"
                    className="add-tag-btn simplified"
                    onClick={() => setShowTagInput(true)}
                  >
                    <FontAwesomeIcon icon={faTag} /> Nova Tag
                  </button>
                </div>
              ) : (
                <div className="tag-input-container simplified">
                  <input
                    type="text"
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    placeholder="Nome da tag"
                    className="tag-input simplified"
                  />
                  <div className="tag-colors simplified">
                    {tagColors.map(cor => (
                      <button
                        key={cor.id}
                        type="button"
                        className={`color-btn ${corSelecionada === cor.cor ? 'selected' : ''}`}
                        style={{ backgroundColor: cor.cor }}
                        onClick={() => setCorSelecionada(cor.cor)}
                        title={cor.nome}
                      />
                    ))}
                  </div>
                  <div className="tag-actions">
                    <button 
                      type="button"
                      className="cancel-btn simplified"
                      onClick={() => {
                        setShowTagInput(false);
                        setNovaTag('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      className="add-btn simplified"
                      onClick={handleAddTag}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Formulário completo para outras etapas
    return (
      <>
        <div className="form-group">
          <label htmlFor="numeroChamado">
            <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Número do Chamado
          </label>
          <input
            type="text"
            id="numeroChamado"
            value={formData.numeroChamado}
            onChange={(e) => setFormData({...formData, numeroChamado: e.target.value})}
            placeholder="Digite o número do chamado"
          />
        </div>

        <div className="form-group">
          <label htmlFor="titulo">
            <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Título
          </label>
          <input
            type="text"
            id="titulo"
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            required
            placeholder="Digite um título para a tarefa"
          />
        </div>

        <div className="form-row">
          <div className="form-group triple">
            <label htmlFor="responsavel">
              <FontAwesomeIcon icon={faUser} className="form-icon" /> Responsável
            </label>
            <select
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {responsaveis.map(resp => (
                <option key={resp.id} value={resp.nome}>
                  {resp.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group triple">
            <label htmlFor="dataInicio">
              <FontAwesomeIcon icon={faCalendarAlt} className="form-icon" /> Data Início
            </label>
            <input
              type="date"
              id="dataInicio"
              value={formData.dataInicio}
              onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
              required
            />
          </div>

          <div className="form-group triple">
            <label htmlFor="dataConclusao">
              <FontAwesomeIcon icon={faCalendarAlt} className="form-icon" /> Data Conclusão
            </label>
            <input
              type="date"
              id="dataConclusao"
              value={formData.dataConclusao}
              onChange={(e) => setFormData({...formData, dataConclusao: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group triple">
            <label htmlFor="prioridade">
              <FontAwesomeIcon icon={faExclamationTriangle} className="form-icon" /> Prioridade
            </label>
            <select
              id="prioridade"
              value={formData.prioridade}
              onChange={(e) => setFormData({...formData, prioridade: e.target.value})}
              required
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className="form-group triple">
            <label htmlFor="progresso">
              <FontAwesomeIcon icon={faSpinner} className="form-icon" /> Progresso
            </label>
            <select
              id="progresso"
              value={formData.progresso}
              onChange={(e) => setFormData({...formData, progresso: e.target.value})}
              required
            >
              <option value="nao_iniciada">Não Iniciada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
        </div>

        <div className="form-group description">
          <label htmlFor="content">
            <FontAwesomeIcon icon={faClipboardList} className="form-icon" /> Descrição
          </label>
          <div className="description-container">
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
              placeholder="Descreva os detalhes da tarefa"
            />
            
            <div className="upload-section">
              <label htmlFor="file-upload" className="upload-btn">
                <FontAwesomeIcon icon={faImage} /> Adicionar imagem
              </label>
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="uploaded-file">
                    <img src={file.url} alt={file.name} />
                    <button 
                      className="remove-file-btn"
                      onClick={() => removeFile(file.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Seção de Tags */}
        <div className="form-group tags-section">
          <label>
            <FontAwesomeIcon icon={faTag} className="form-icon" /> Tags
          </label>
          <div className="tags-container">
            {formData.tags?.map(tag => (
              <span 
                key={tag.id} 
                className="tag" 
                style={{ backgroundColor: tag.cor }}
              >
                {tag.texto}
                <button 
                  type="button"
                  className="remove-tag-btn"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  ×
                </button>
              </span>
            ))}
            
            {!showTagInput ? (
              <div className="tags-actions">
                <select
                  className="existing-tags-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedTag = availableTags.find(tag => tag.id === parseInt(e.target.value));
                      if (selectedTag && !formData.tags?.find(tag => tag.id === selectedTag.id)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), selectedTag]
                        }));
                      }
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Selecionar tag existente...</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.texto}
                    </option>
                  ))}
                </select>
                
                <button 
                  type="button"
                  className="add-tag-btn"
                  onClick={() => setShowTagInput(true)}
                >
                  <FontAwesomeIcon icon={faTag} /> Nova Tag
                </button>
              </div>
            ) : (
              <div className="tag-input-container">
                <input
                  type="text"
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  placeholder="Nome da tag"
                  className="tag-input"
                />
                <div className="tag-colors">
                  {tagColors.map(cor => (
                    <button
                      key={cor.id}
                      type="button"
                      className={`color-btn ${corSelecionada === cor.cor ? 'selected' : ''}`}
                      style={{ backgroundColor: cor.cor }}
                      onClick={() => setCorSelecionada(cor.cor)}
                      title={cor.nome}
                    />
                  ))}
                </div>
                <div className="tag-actions">
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowTagInput(false);
                      setNovaTag('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className="add-btn"
                    onClick={handleAddTag}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Modal de confirmaço para mover para outra etapa
  const handleConfirmMove = () => {
    setIsConfirmModalOpen(false);
    setIsModalOpen(true);
  };

  // Atualize a função aplicarFiltros
  const aplicarFiltros = () => {
    let resultado = {};
    
    Object.keys(tasks).forEach(coluna => {
      resultado[coluna] = tasks[coluna].filter(tarefa => {
        let passouFiltro = true;

        // Filtro por texto (nome, ID ou chamado)
        if (filtros.busca) {
          if (filtros.tipoBusca === 'nome') {
            passouFiltro = passouFiltro && tarefa.titulo.toLowerCase().includes(filtros.busca.toLowerCase());
          } else if (filtros.tipoBusca === 'id') {
            passouFiltro = passouFiltro && tarefa.taskId?.toString().includes(filtros.busca);
          } else if (filtros.tipoBusca === 'chamado') {
            passouFiltro = passouFiltro && tarefa.numeroChamado?.toString().toLowerCase().includes(filtros.busca.toLowerCase());
          }
        }

        // Filtro por data
        if (filtros.dataInicio && filtros.dataFim) {
          const dataInicio = new Date(filtros.dataInicio);
          const dataFim = new Date(filtros.dataFim);
          const dataTarefa = tarefa.dataInicio ? new Date(tarefa.dataInicio) : null;
          
          if (dataTarefa) {
            passouFiltro = passouFiltro && 
              dataTarefa >= dataInicio && 
              dataTarefa <= dataFim;
          }
        }

        // Filtro por prioridade
        if (filtros.prioridade) {
          passouFiltro = passouFiltro && tarefa.prioridade === filtros.prioridade;
        }

        // Filtro por tag
        if (filtros.tag) {
          passouFiltro = passouFiltro && 
            tarefa.tags?.some(tag => tag.id === parseInt(filtros.tag));
        }

        return passouFiltro;
      });
    });

    setTarefasFiltradas(resultado);
  };

  // Função para limpar os filtros
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      tipoBusca: 'nome', // Mantém o tipo de busca como 'nome' por padrão
      prioridade: '',
      dataInicio: '',
      dataFim: '',
      tag: ''
    });
  };

  // Adicionar função para lidar com o pressionamento de tecla
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  // Renderização dos filtros
  const renderFiltros = () => (
    <div className="filtros-section">
      <div className="filtros-container">
        {/* Primeira linha - Busca */}
        <div className="filtros-linha">
          <div className="filtro-grupo">
            <label>Buscar por</label>
            <div className="busca-container">
              <Select
                value={{ 
                  value: filtros.tipoBusca, 
                  label: filtros.tipoBusca === 'nome' ? 'Nome' : 
                         filtros.tipoBusca === 'id' ? 'ID' : 'Chamado'
                }}
                onChange={(option) => setFiltros({
                  ...filtros, 
                  tipoBusca: option ? option.value : 'nome'
                })}
                options={[
                  { value: 'nome', label: 'Nome' },
                  { value: 'id', label: 'ID' },
                  { value: 'chamado', label: 'Chamado' }
                ]}
                className="react-select-container tipo-busca"
                classNamePrefix="react-select"
                placeholder="Selecione"
                isSearchable={false}
              />
              <div className="busca-input-container">
                <i className="material-icons busca-icon">search</i>
                <input
                  type="text"
                  placeholder={`Buscar por ${
                    filtros.tipoBusca === 'nome' ? 'nome' : 
                    filtros.tipoBusca === 'id' ? 'ID' : 
                    'número do chamado'
                  }...`}
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda linha - Demais filtros */}
        <div className="filtros-linha">
          <div className="filtro-grupo">
            <label>Período</label>
            <div className="filtro-datas">
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                placeholder="Data Início"
              />
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                placeholder="Data Fim"
              />
            </div>
          </div>

          <div className="filtro-grupo">
            <label>Prioridade</label>
            <Select
              value={[
                { value: filtros.prioridade, label: filtros.prioridade ? 
                  filtros.prioridade.charAt(0).toUpperCase() + filtros.prioridade.slice(1) : '' }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, prioridade: option ? option.value : ''})}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
                { value: 'urgente', label: 'Urgente' }
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Selecione"
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Tag</label>
            <Select
              value={[
                { value: filtros.tag, label: availableTags.find(t => t.id === parseInt(filtros.tag))?.texto || '' }
              ].filter(option => option.value !== '')}
              onChange={(option) => setFiltros({...filtros, tag: option ? option.value : ''})}
              options={availableTags.map(tag => ({
                value: tag.id.toString(),
                label: tag.texto
              }))}
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
        <i className="material-icons">clear</i>
        Limpar Filtros
      </button>
    </div>
  );

  const handleDeleteStage = () => {
    setStageToDelete(editingStage);
    setIsEditStageModalOpen(false);
    setIsDeleteStageModalOpen(true);
  };

  const confirmDeleteStage = () => {
    const newTasks = { ...tasks };
    delete newTasks[stageToDelete.id];
    
    // Move as tarefas da etapa excluída para "A Definir"
    if (newTasks[stageToDelete.id]?.length > 0) {
      newTasks.aDefinir = [
        ...newTasks.aDefinir,
        ...newTasks[stageToDelete.id]
      ];
    }

    updateProjectKanban(newTasks);
    setIsDeleteStageModalOpen(false);
    setStageToDelete(null);
    setEditingStage(null);
    setNewStageName('');
    setStagePosition(0);
  };

  const handleAddTag = () => {
    if (novaTag.trim()) {
      // Verifica se a tag já existe
      const tagExistente = availableTags.find(
        tag => tag.texto.toLowerCase() === novaTag.trim().toLowerCase()
      );

      if (!tagExistente) {
        // Cria nova tag com a cor selecionada
        const novaTagObj = {
          id: Date.now(),
          texto: novaTag.trim(),
          cor: corSelecionada
        };
        
        setAvailableTags(prev => [...prev, novaTagObj]);
        
        // Adiciona a nova tag ao formData
        const tagsAtuais = formData.tags || [];
        setFormData(prev => ({
          ...prev,
          tags: [...tagsAtuais, novaTagObj]
        }));
      } else {
        // Se a tag já existe, apenas adiciona ao formData se ainda não estiver lá
        const tagsAtuais = formData.tags || [];
        if (!tagsAtuais.find(tag => tag.id === tagExistente.id)) {
          setFormData(prev => ({
            ...prev,
            tags: [...tagsAtuais, tagExistente]
          }));
        }
      }
      
      setNovaTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

  // Adicione este useEffect
  useEffect(() => {
    if (location.state?.selectedProjectId) {
      const projeto = projetos.find(p => p.id === location.state.selectedProjectId);
      if (projeto) {
        handleProjectSelect(projeto);
      }
    }
  }, [location.state]);

  // Adicione esta função para editar projeto
  const handleEditProject = (e, projeto) => {
    e.stopPropagation(); // Impede que o card seja selecionado ao clicar no botão de editar
    setEditingProject({
      ...projeto
    });
    setIsEditProjectModalOpen(true);
  };

  // Adicione esta função para salvar as alterações do projeto
  const handleSaveProject = (e) => {
    e.preventDefault();
    
    const updatedProjetos = projetos.map(proj => 
      proj.id === editingProject.id ? editingProject : proj
    );
    
    setProjetos(updatedProjetos);
    
    // Se o projeto sendo editado é o selecionado, atualiza ele também
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject(editingProject);
    }
    
    setIsEditProjectModalOpen(false);
    setEditingProject(null);
  };

  // Adicione estas funções para lidar com a exclusão
  const handleDeleteProject = () => {
    setProjectToDelete(editingProject);
    setIsEditProjectModalOpen(false);
    setIsDeleteProjectModalOpen(true);
  };

  const confirmDeleteProject = async () => {
    try {
      // Remove o projeto do Firebase
      const projetoRef = doc(db, 'projetosTarefas', projectToDelete.id);
      await deleteDoc(projetoRef);
      
      // Atualiza o estado local
      const updatedProjetos = projetos.filter(proj => proj.id !== projectToDelete.id);
      setProjetos(updatedProjetos);
      
      // Se o projeto excluído era o selecionado, limpa a seleção
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
        setTasks({
          aDefinir: [],
          todo: [],
          inProgress: [],
          testing: [],
          prontoDeploy: [],
          done: [],
          arquivado: []
        });
      }
      
      setIsDeleteProjectModalOpen(false);
      setProjectToDelete(null);
      setEditingProject(null);
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      // Aqui você pode adicionar uma notificação de erro para o usurio
    }
  };

  // Modifique a função handleAddProject
  const handleAddProject = async () => {
    if (selectedProjectsToAdd.length > 0) {
      try {
        const projetosRef = collection(db, 'projetosTarefas');
        
        // Cria um array de promessas para adicionar múltiplos projetos
        const addPromises = selectedProjectsToAdd.map(async (projeto) => {
          const newProject = {
            projetoId: projeto.id,
            nome: projeto.nome || '',
            tipo: projeto.tipo || 'SAC',
            analista: projeto.analista || '',
            desenvolvedor: projeto.desenvolvedor || '',
            status: projeto.status || 'Em Andamento',
            dataInicio: projeto.dataInicio || new Date().toISOString().split('T')[0],
            dataConclusao: projeto.dataConclusao || '',
            descricao: projeto.descricao || '',
            prioridade: projeto.prioridade || 'media',
            kanban: {
              aDefinir: [],
              todo: [],
              inProgress: [],
              testing: [],
              prontoDeploy: [],
              done: [],
              arquivado: []
            }
          };
          
          return await addDoc(projetosRef, newProject);
        });

        // Aguarda todas as promessas serem resolvidas
        const results = await Promise.all(addPromises);
        
        // Atualiza o estado local com os novos projetos
        const newProjetos = selectedProjectsToAdd.map((projeto, index) => ({
          ...projeto,
          id: results[index].id
        }));
        
        setProjetos(prev => [...prev, ...newProjetos]);
        
        setIsAddProjectModalOpen(false);
        setSelectedProjectsToAdd([]);
      } catch (error) {
        console.error('Erro ao adicionar projetos:', error);
      }
    }
  };

  // Modifique a função fetchAvailableProjects
  const fetchAvailableProjects = async () => {
    setIsLoadingProjects(true);
    setLoadError(null);
    
    try {
      // Busca todos os projetos da coleção principal
      const projetosRef = collection(db, 'projetos');
      const snapshot = await getDocs(projetosRef);
      const todosProjetos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          tipo: data.tipo,
          analista: data.analistaPrincipal?.[0]?.label || 'Não definido', // Acessa o primeiro item do array
          desenvolvedor: data.desenvolvedorPrincipal?.[0]?.label || 'Não definido', // Acessa o primeiro item do array
          status: data.status,
          dataInicio: data.dataInicio,
          dataConclusao: data.dataConclusao,
          descricao: data.descricao
        };
      });
      
      // Busca os IDs dos projetos já adicionados
      const projetosAdicionadosRef = collection(db, 'projetosTarefas');
      const projetosAdicionadosSnapshot = await getDocs(projetosAdicionadosRef);
      const idsAdicionados = projetosAdicionadosSnapshot.docs.map(doc => doc.data().projetoId);
      
      // Filtra para mostrar apenas os projetos não adicionados
      const projetosDisponiveis = todosProjetos.filter(
        projeto => !idsAdicionados.includes(projeto.id)
      );
      
      setAvailableProjects(projetosDisponiveis);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setLoadError('Erro ao carregar a lista de projetos. Tente novamente.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Modifique a função que abre o modal para buscar os projetos
  const handleOpenAddProjectModal = () => {
    setIsAddProjectModalOpen(true);
    fetchAvailableProjects();
  };

  // Adicione esta função para carregar os projetos adicionados
  const loadAddedProjects = async () => {
    try {
      const projetosRef = collection(db, 'projetosTarefas');
      const snapshot = await getDocs(projetosRef);
      
      const projetosCarregados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjetos(projetosCarregados);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  // Adicione este useEffect para carregar os projetos ao montar o componente
  useEffect(() => {
    loadAddedProjects();
  }, []);

  // Adicione esta função para aplicar os filtros
  const aplicarFiltrosProjetos = () => {
    let resultado = projetos.filter(projeto => {
      let passouFiltro = true;

      if (filtrosProjetos.busca) {
        passouFiltro = passouFiltro && projeto.nome.toLowerCase().includes(filtrosProjetos.busca.toLowerCase());
      }

      if (filtrosProjetos.tipo) {
        passouFiltro = passouFiltro && projeto.tipo === filtrosProjetos.tipo;
      }

      if (filtrosProjetos.analista) {
        passouFiltro = passouFiltro && projeto.analista?.toLowerCase().includes(filtrosProjetos.analista.toLowerCase());
      }

      if (filtrosProjetos.desenvolvedor) {
        passouFiltro = passouFiltro && projeto.desenvolvedor?.toLowerCase().includes(filtrosProjetos.desenvolvedor.toLowerCase());
      }

      return passouFiltro;
    });

    setProjetosFiltrados(resultado);
  };

  // Adicione este useEffect para atualizar os filtros
  useEffect(() => {
    aplicarFiltrosProjetos();
  }, [projetos, filtrosProjetos]);

  // Adicione esta função para limpar os filtros
  const limparFiltrosProjetos = () => {
    setFiltrosProjetos({
      busca: '',
      tipo: '',
      analista: '',
      desenvolvedor: ''
    });
    setProjetosFiltrados(projetos);
  };

  // Modifique o renderFiltrosProjetos para usar React Select
  const renderFiltrosProjetos = () => {
    // Crie as opções para os selects de analista e desenvolvedor
    const analistaOptions = Array.from(new Set(projetos.map(p => p.analista)))
      .filter(Boolean)
      .map(analista => ({ value: analista, label: analista }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    const desenvolvedorOptions = Array.from(new Set(projetos.map(p => p.desenvolvedor)))
      .filter(Boolean)
      .map(desenvolvedor => ({ value: desenvolvedor, label: desenvolvedor }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    return (
      <div className="filtros-container">
        <div className="filtros-grupo">
          <div className="filtro-busca">
            <div className="busca-input-container">
              <FontAwesomeIcon icon={faSearch} className="busca-icon" />
              <input
                type="text"
                placeholder="Buscar projeto..."
                value={filtrosProjetos.busca}
                onChange={(e) => setFiltrosProjetos({...filtrosProjetos, busca: e.target.value})}
              />
            </div>
          </div>

          <div className="filtro-select">
            <select
              value={filtrosProjetos.tipo}
              onChange={(e) => setFiltrosProjetos({...filtrosProjetos, tipo: e.target.value})}
            >
              <option value="">Todos os tipos</option>
              <option value="SAC">SAC</option>
              <option value="OL">OL</option>
            </select>
          </div>

          <div className="filtro-select">
            <Select
              isClearable
              placeholder="Filtrar por analista..."
              value={filtrosProjetos.analista ? { value: filtrosProjetos.analista, label: filtrosProjetos.analista } : null}
              onChange={(selected) => setFiltrosProjetos({
                ...filtrosProjetos, 
                analista: selected ? selected.value : ''
              })}
              options={[
                { value: '', label: 'Todos os analistas' },
                ...analistaOptions
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="filtro-select">
            <Select
              isClearable
              placeholder="Filtrar por desenvolvedor..."
              value={filtrosProjetos.desenvolvedor ? { value: filtrosProjetos.desenvolvedor, label: filtrosProjetos.desenvolvedor } : null}
              onChange={(selected) => setFiltrosProjetos({
                ...filtrosProjetos, 
                desenvolvedor: selected ? selected.value : ''
              })}
              options={[
                { value: '', label: 'Todos os desenvolvedores' },
                ...desenvolvedorOptions
              ]}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="filtros-acoes">
            <button className="limpar-filtros-btn" onClick={limparFiltrosProjetos}>
              <FontAwesomeIcon icon={faTimes} /> Limpar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modifique o useEffect que carrega os responsáveis
  useEffect(() => {
    const loadResponsaveis = async () => {
      try {
        const projetosRef = collection(db, 'projetos');
        const snapshot = await getDocs(projetosRef);
        const responsaveisSet = new Set();

        snapshot.docs.forEach(doc => {
          const projetoData = doc.data();
          
          // Adiciona apenas analistas e desenvolvedores
          projetoData.analistaPrincipal?.forEach(analista => {
            responsaveisSet.add(JSON.stringify({ 
              id: analista.value, 
              nome: analista.label,
              cargo: 'Analista'
            }));
          });
          projetoData.analistaBackup?.forEach(analista => {
            responsaveisSet.add(JSON.stringify({ 
              id: analista.value, 
              nome: analista.label,
              cargo: 'Analista'
            }));
          });

          projetoData.desenvolvedorPrincipal?.forEach(dev => {
            responsaveisSet.add(JSON.stringify({ 
              id: dev.value, 
              nome: dev.label,
              cargo: 'Desenvolvedor'
            }));
          });
          projetoData.desenvolvedorBackup?.forEach(dev => {
            responsaveisSet.add(JSON.stringify({ 
              id: dev.value, 
              nome: dev.label,
              cargo: 'Desenvolvedor'
            }));
          });
        });

        const responsaveisList = Array.from(responsaveisSet)
          .map(json => JSON.parse(json))
          .filter(resp => ['Analista', 'Desenvolvedor'].includes(resp.cargo));

        setResponsaveis(responsaveisList);

        // Se houver um projeto selecionado, pré-seleciona o analista principal
        if (selectedProject?.analistaPrincipal?.[0]) {
          setFormData(prev => ({
            ...prev,
            responsavel: selectedProject.analistaPrincipal[0].value
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
      }
    };

    loadResponsaveis();
  }, [selectedProject]);

  // Atualize a função que fecha o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    clearFormAndImages(); // Usa a função existente para limpar o formulário
  };

  // Modifique o useEffect que carrega as tarefas iniciais
  useEffect(() => {
    const loadTarefas = async () => {
      if (!selectedProject?.id) return;

      try {
        const projetoRef = doc(db, 'projetosTarefas', selectedProject.id);
        const projetoDoc = await getDoc(projetoRef);

        if (projetoDoc.exists()) {
          const kanbanData = projetoDoc.data().kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: []
          };

          // Garante que todas as colunas existam
          const kanbanCompleto = {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: [],
            ...kanbanData
          };

          setTasks(kanbanCompleto);
        } else {
          // Se o documento não existir, cria um novo com a estrutura básica
          const kanbanInicial = {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: []
          };

          await setDoc(projetoRef, { kanban: kanbanInicial });
          setTasks(kanbanInicial);
        }
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        alert('Erro ao carregar tarefas. Por favor, recarregue a página.');
      }
    };

    loadTarefas();
  }, [selectedProject?.id]);

  // Atualize a função que manipula a seleção de projetos
  const handleProjectSelection = (project) => {
    setSelectedProjectsToAdd(prev => {
      const isSelected = prev.some(p => p.id === project.id);
      if (isSelected) {
        return prev.filter(p => p.id !== project.id);
      } else {
        return [...prev, project];
      }
    });
  };

  // Adicione esta função para selecionar todos os projetos
  const handleSelectAllProjects = () => {
    if (selectedProjectsToAdd.length === availableProjects.length) {
      setSelectedProjectsToAdd([]); // Desmarca todos se já estiverem todos selecionados
    } else {
      setSelectedProjectsToAdd([...availableProjects]); // Seleciona todos
    }
  };

  // Função para abrir o modal de tarefa arquivada
  const handleArchivedTaskClick = (task) => {
    setArchivedTask(task);
    setIsArchivedTaskModalOpen(true);
  };

  // Função para confirmar exclusão de tarefa arquivada
  const confirmDeleteArchivedTask = () => {
    const newTasks = {
      ...tasks,
      arquivado: tasks.arquivado.filter(t => t.id !== archivedTask.id)
    };
    updateProjectKanban(newTasks);
    setIsConfirmDeleteArchivedTaskModalOpen(false);
    setIsArchivedTaskModalOpen(false);
    setArchivedTask(null);
  };

  // Adicione esta função para formatar as mensagens de log
  const getLogMessage = (log) => {
    switch (log.tipo) {
      case 'criacao':
        return 'Tarefa criada';
      case 'edicao':
        return 'Tarefa editada';
      case 'movimentacao':
        const [origem, destino] = log.detalhes.split('Movida de')[1].split('para').map(s => s.trim());
        return `Movida de ${getStatusDisplay(origem)} para ${getStatusDisplay(destino)}`;
      case 'comentario':
        return log.detalhes;
      default:
        return log.detalhes;
    }
  };

  return (
    <div className="tarefas-container">
      <Sidebar />
      <div className="tarefas-content">
        <div className="header-with-button">
          <h1 className="page-title">Tarefas</h1>
          <button 
            className="add-project-btn"
            onClick={handleOpenAddProjectModal}
          >
            <FontAwesomeIcon icon={faPlus} /> Adicionar Projeto
          </button>
        </div>

        {renderFiltrosProjetos()}

        <div className="project-cards">
          {(projetosFiltrados.length > 0 ? projetosFiltrados : projetos).map(projeto => (
            <div 
              key={projeto.id} 
              className={`project-card ${selectedProject?.id === projeto.id ? 'selected' : ''}`}
              onClick={() => handleProjectSelect(projeto)}
            >
              <div className="project-card-header">
                <h3>{projeto.nome}</h3>
                <div className="project-header-actions">
                  <span className="project-type">{projeto.tipo}</span>
                  <button 
                    className="edit-project-btn"
                    onClick={(e) => handleEditProject(e, projeto)}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>
                </div>
              </div>
              <div className="project-card-content">
                <div className="project-info">
                  <span>Analista: {projeto.analista}</span>
                  <span>Desenvolvedor: {projeto.desenvolvedor}</span>
                </div>
                <div className="task-count">
                  <span>
                    {getTotalTasks(projeto)} tarefas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban */}
        {selectedProject && (
          <div className="kanban-container" style={{ display: 'block', opacity: 1 }}>
            {renderFiltros()}
            <div className="kanban-board" style={{ opacity: 1, transform: 'none' }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  {/* Coluna A Definir */}
                  <div className="kanban-column" style={{ flex: 1, minWidth: '300px' }}>
                    <div className="column-header">
                      <h2 className="column-title">A Definir</h2>
                      <div className="column-actions">
                        <button 
                          className="add-task-btn"
                          onClick={() => handleAddTaskToColumn('aDefinir')}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <button 
                          className="edit-stage-btn"
                          onClick={() => handleEditStage('aDefinir', 'A Definir')}
                        >
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                      </div>
                    </div>
                    <Droppable droppableId="aDefinir">
                      {(provided, snapshot) => (
                        <div
                          className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {(tarefasFiltradas?.aDefinir || tasks.aDefinir).map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <div className="task-header">
                                    <div className="task-id">#{task.taskId}</div>
                                    <div className="task-title">{task.titulo}</div>
                                  </div>

                                  {task.numeroChamado && (
                                    <div className="task-chamado">
                                      <span className="chamado-label">Chamado:</span>
                                      <span className="chamado-number">{task.numeroChamado}</span>
                                    </div>
                                  )}

                                  <div className="task-metadata">
                                    <span className={`task-priority priority-${task.prioridade}`}>
                                      {task.prioridade?.charAt(0).toUpperCase() + task.prioridade?.slice(1) || 'Sem prioridade'}
                                    </span>
                                    <div className="task-tags-list">
                                      {task.tags?.map(tag => (
                                        <span 
                                          key={tag.id}
                                          className="task-tag"
                                          style={{ backgroundColor: tag.cor }}
                                        >
                                          <FontAwesomeIcon icon={faTag} className="tag-icon" />
                                          {tag.texto}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="task-content">{task.content}</div>

                                  <div className="task-footer">
                                    <span className="task-assignee">{task.responsavel}</span>
                                    <div className="task-dates">
                                      <span className="task-date">
                                        {task.dataConclusao ? (
                                          <>
                                            <span className="date-label">Conclusão:</span>
                                            {format(new Date(task.dataConclusao), 'dd/MM/yyyy')}
                                          </>
                                        ) : 'Sem data de conclusão'}
                                      </span>
                                      {task.arquivadoEm && (
                                        <span className="archived-date">
                                          <span className="date-label">Arquivado em:</span>
                                          {format(new Date(task.arquivadoEm), 'dd/MM/yyyy')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>

                  {/* Outras colunas */}
                  {Object.entries({
                    todo: tarefasFiltradas?.todo || tasks.todo || [],
                    inProgress: tarefasFiltradas?.inProgress || tasks.inProgress || [],
                    testing: tarefasFiltradas?.testing || tasks.testing || [],
                    prontoDeploy: tarefasFiltradas?.prontoDeploy || tasks.prontoDeploy || [],
                    done: tarefasFiltradas?.done || tasks.done || [],
                    arquivado: tarefasFiltradas?.arquivado || tasks.arquivado || []
                  }).map(([columnId, columnTasks]) => (
                    <div className="kanban-column" key={columnId} style={{ flex: 1, minWidth: '300px' }}>
                      <div className="column-header">
                        <h2 className="column-title">
                          {columnId === 'todo' && 'A Fazer'}
                          {columnId === 'inProgress' && 'Em Andamento'}
                          {columnId === 'testing' && 'Em Teste'}
                          {columnId === 'prontoDeploy' && 'Pronto para Deploy'}
                          {columnId === 'done' && 'Concluído'}
                          {columnId === 'arquivado' && 'Arquivado'}
                        </h2>
                        <div className="column-actions">
                          {columnId !== 'arquivado' && (
                            <button 
                              className="add-task-btn"
                              onClick={() => handleAddTaskToColumn(columnId)}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          )}
                          <button 
                            className="edit-stage-btn"
                            onClick={() => handleEditStage(
                              columnId,
                              columnId === 'arquivado' ? 'Arquivado' :
                              columnId === 'todo' ? 'A Fazer' :
                              columnId === 'inProgress' ? 'Em Andamento' :
                              columnId === 'testing' ? 'Em Teste' :
                              columnId === 'prontoDeploy' ? 'Pronto para Deploy' :
                              'Concluído'
                            )}
                          >
                            <FontAwesomeIcon icon={faEllipsisV} />
                          </button>
                        </div>
                      </div>
                      <Droppable droppableId={columnId}>
                        {(provided, snapshot) => (
                          <div
                            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {columnTasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    <div className="task-header">
                                      <div className="task-id">#{task.taskId}</div>
                                      <div className="task-title">{task.titulo}</div>
                                    </div>

                                    {task.numeroChamado && (
                                      <div className="task-chamado">
                                        <span className="chamado-label">Chamado:</span>
                                        <span className="chamado-number">{task.numeroChamado}</span>
                                      </div>
                                    )}

                                    <div className="task-metadata">
                                      <span className={`task-priority priority-${task.prioridade}`}>
                                        {task.prioridade?.charAt(0).toUpperCase() + task.prioridade?.slice(1) || 'Sem prioridade'}
                                      </span>
                                      <div className="task-tags-list">
                                        {task.tags?.map(tag => (
                                          <span 
                                            key={tag.id}
                                            className="task-tag"
                                            style={{ backgroundColor: tag.cor }}
                                          >
                                            <FontAwesomeIcon icon={faTag} className="tag-icon" />
                                            {tag.texto}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="task-content">{task.content}</div>

                                    <div className="task-footer">
                                      <span className="task-assignee">{task.responsavel}</span>
                                      <div className="task-dates">
                                        <span className="task-date">
                                          {task.dataConclusao ? (
                                            <>
                                              <span className="date-label">Conclusão:</span>
                                              {format(new Date(task.dataConclusao), 'dd/MM/yyyy')}
                                            </>
                                          ) : 'Sem data de conclusão'}
                                        </span>
                                        {task.arquivadoEm && (
                                          <span className="archived-date">
                                            <span className="date-label">Arquivado em:</span>
                                            {format(new Date(task.arquivadoEm), 'dd/MM/yyyy')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            </div>
          </div>
        )}

        {/* Se não houver projeto selecionado, mostra uma mensagem */}
        {!selectedProject && (
          <div className="no-project-message">
            <p>Selecione um projeto para visualizar as tarefas</p>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="selected-project-card">
                <div className="project-info">
                  <h3>{selectedProject.nome}</h3>
                  <span className="project-type">{selectedProject.tipo}</span>
                </div>
                <div className="project-members">
                  <div>
                    <span className="member-label">Analista:</span> {selectedProject.analista}
                  </div>
                  <div>
                    <span className="member-label">Desenvolvedor:</span> {selectedProject.desenvolvedor}
                  </div>
                </div>
              </div>

              <h2>{formData.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Primeira linha - Número do Chamado e Título */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="numeroChamado">Número do Chamado</label>
                      <input
                        type="text"
                        id="numeroChamado"
                        value={formData.numeroChamado}
                        onChange={(e) => setFormData({ ...formData, numeroChamado: e.target.value })}
                        placeholder="Digite o número do chamado"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="titulo">
                        Título <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        required
                        placeholder="Digite um título para a tarefa"
                        className={showValidation && !formData.titulo.trim() ? 'input-error' : ''}
                      />

                    </div>
                  </div>

                  {/* Segunda linha - Responsável e Datas */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="responsavel">Responsável</label>
                      <Select
                        isMulti
                        id="responsavel"
                        value={responsaveis.filter(resp => 
                          formData.responsavel?.includes(resp.id)
                        ).map(resp => ({
                          value: resp.id,
                          label: `${resp.nome} (${resp.cargo})`
                        }))}
                        onChange={(selectedOptions) => {
                          setFormData({
                            ...formData,
                            responsavel: selectedOptions.map(option => option.value)
                          });
                        }}
                        options={responsaveis
                          .filter(resp => ['Analista', 'Desenvolvedor'].includes(resp.cargo))
                          .map(resp => ({
                            value: resp.id,
                            label: `${resp.nome} (${resp.cargo})`
                          }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Selecione os responsáveis..."
                        noOptionsMessage={() => "Nenhum responsável encontrado"}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dataInicio">Data Início</label>
                      <input
                        type="date"
                        id="dataInicio"
                        value={formData.dataInicio}
                        onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dataConclusao">Data Conclusão</label>
                      <input
                        type="date"
                        id="dataConclusao"
                        value={formData.dataConclusao}
                        onChange={(e) => setFormData({ ...formData, dataConclusao: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Terceira linha - Prioridade e Progresso */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="prioridade">Prioridade</label>
                      <select
                        id="prioridade"
                        value={formData.prioridade}
                        onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="progresso">Progresso</label>
                      <select
                        id="progresso"
                        value={formData.progresso}
                        onChange={(e) => setFormData({ ...formData, progresso: e.target.value })}
                      >
                        <option value="nao_iniciada">Não Iniciada</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                      </select>
                    </div>
                  </div>

                  {/* Descrição da Tarefa */}
                  <div className="form-group full-width">
                    <label htmlFor="descricao">Descrição</label>
                    <textarea
                      id="descricao"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Descreva os detalhes da tarefa"
                      rows="4"
                    />
                  </div>

                  {/* Seção de Tags */}
                  <div className="form-group full-width">
                    <label>
                      <FontAwesomeIcon icon={faTag} className="form-icon" /> Tags
                    </label>
                    <div className="tags-container">
                      {formData.tags?.map(tag => (
                        <span 
                          key={tag.id} 
                          className="tag" 
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.texto}
                          <button 
                            type="button"
                            className="remove-tag-btn"
                            onClick={() => handleRemoveTag(tag.id)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      
                      {!showTagInput ? (
                        <div className="tags-actions">
                          <select
                            className="existing-tags-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                const selectedTag = availableTags.find(tag => tag.id === parseInt(e.target.value));
                                if (selectedTag && !formData.tags?.find(tag => tag.id === selectedTag.id)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), selectedTag]
                                  }));
                                }
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Selecionar tag existente...</option>
                            {availableTags.map(tag => (
                              <option key={tag.id} value={tag.id}>
                                {tag.texto}
                              </option>
                            ))}
                          </select>
                          
                          <button 
                            type="button"
                            className="add-tag-btn"
                            onClick={() => setShowTagInput(true)}
                          >
                            <FontAwesomeIcon icon={faTag} /> Nova Tag
                          </button>
                        </div>
                      ) : (
                        <div className="tag-input-container">
                          <input
                            type="text"
                            value={novaTag}
                            onChange={(e) => setNovaTag(e.target.value)}
                            placeholder="Nome da tag"
                            className="tag-input"
                          />
                          <div className="tag-colors">
                            {tagColors.map(cor => (
                              <button
                                key={cor.id}
                                type="button"
                                className={`color-btn ${corSelecionada === cor.cor ? 'selected' : ''}`}
                                style={{ backgroundColor: cor.cor }}
                                onClick={() => setCorSelecionada(cor.cor)}
                                title={cor.nome}
                              />
                            ))}
                          </div>
                          <div className="tag-actions">
                            <button 
                              type="button"
                              className="cancel-btn"
                              onClick={() => {
                                setShowTagInput(false);
                                setNovaTag('');
                              }}
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button"
                              className="add-btn"
                              onClick={handleAddTag}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção de Upload de Imagens */}
                  <div className="form-group full-width">
                    <label htmlFor="file-upload">
                      <FontAwesomeIcon icon={faImage} className="form-icon" /> Anexar Imagens
                    </label>
                    <div className="upload-section">
                      <label htmlFor="file-upload" className="upload-btn">
                        <FontAwesomeIcon icon={faImage} /> Adicionar imagem
                      </label>
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="uploaded-files">
                        {uploadedFiles.map(file => (
                          <div key={file.id} className="uploaded-file">
                            <img src={file.url} alt={file.name} />
                            <button 
                              className="remove-file-btn"
                              onClick={() => removeFile(file.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCloseModal} // Use a função handleCloseModal
                  >
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

        {isNewStageModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Nova Etapa</h2>
              <form onSubmit={handleSubmitNewStage}>
                <div className="form-group">
                  <label htmlFor="stageName">Nome da Etapa</label>
                  <input
                    type="text"
                    id="stageName"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    required
                    placeholder="Digite o nome da nova etapa"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stagePosition">Posição</label>
                  <select
                    id="stagePosition"
                    value={stagePosition}
                    onChange={(e) => setStagePosition(Number(e.target.value))}
                    required
                  >
                    {Object.keys(tasks).map((_, index) => (
                      <option key={index} value={index}>
                        {index + 1}ª posição
                      </option>
                    ))}
                    <option value={Object.keys(tasks).length}>
                      {Object.keys(tasks).length + 1}ª posição
                    </option>
                  </select>
                </div>

                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setIsNewStageModalOpen(false);
                      setNewStageName('');
                      setStagePosition(0);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn">
                    Criar Etapa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditStageModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editar Etapa</h2>
              <form onSubmit={handleSubmitEditStage}>
                <div className="form-group">
                  <label htmlFor="stageName">Nome da Etapa</label>
                  <input
                    type="text"
                    id="stageName"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    required
                    placeholder="Digite o nome da etapa"
                  />
                </div>

                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setIsEditStageModalOpen(false);
                      setEditingStage(null);
                      setNewStageName('');
                    }}
                  >
                    Cancelar
                  </button>
                  {editingStage?.id !== 'aDefinir' && (
                    <button 
                      type="button" 
                      className="delete-btn"
                      onClick={handleDeleteStage}
                    >
                      Excluir Etapa
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

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedTask && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="task-details">
                <div className="task-header">
                  <h2>{selectedTask.titulo}</h2>
                  {selectedTask.numeroChamado && (
                    <span className="task-chamado">Chamado: {selectedTask.numeroChamado}</span>
                  )}
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div className="tags-container">
                    {selectedTask.tags.map(tag => (
                      <span 
                        key={tag.id} 
                        className="tag" 
                        style={{ backgroundColor: tag.cor }}
                      >
                        {tag.texto}
                      </span>
                    ))}
                  </div>
                )}

                <div className="task-info-cards">
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">person</i>
                      <h3>Responsáveis</h3>
                    </div>
                    <div className="info-card-content">
                      {Array.isArray(selectedTask.responsavel) ? 
                        selectedTask.responsavel.join(', ') : 
                        selectedTask.responsavel || 'Não atribuído'}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">flag</i>
                      <h3>Status</h3>
                    </div>
                    <div className="info-card-content">
                      <span className={`status-badge status-${selectedTask.status}`}>
                        {getStatusDisplay(selectedTask.status)}
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">priority_high</i>
                      <h3>Prioridade</h3>
                    </div>
                    <div className="info-card-content">
                      <span className={`priority-badge priority-${selectedTask.prioridade}`}>
                        {selectedTask.prioridade || 'Não definida'}
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">event</i>
                      <h3>Data Início</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.dataInicio || 'Não definida'}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">event_available</i>
                      <h3>Data Conclusão</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.dataConclusao || 'Não definida'}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">trending_up</i>
                      <h3>Progresso</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.progresso || 'Não iniciada'}
                    </div>
                  </div>
                </div>

                {selectedTask.content && (
                  <div className="task-description-section">
                    <div className="section-header">
                      <i className="material-icons">description</i>
                      <h3>Descrição</h3>
                    </div>
                    <div className="description-content">
                      <p>{selectedTask.content}</p>
                    </div>
                  </div>
                )}

                {/* Seção de Comentários */}
                <div className="comments-section">
                  <div className="section-header">
                    <i className="material-icons" id="chat-icon">chat</i>
                    <h3>Comentários</h3>
                    {selectedTask.status !== 'arquivado' && (
                      <button 
                        className="add-comment-btn"
                        onClick={() => setShowCommentInput(!showCommentInput)}
                      >
                        <i className="material-icons">add_comment</i>
                        Comentar
                      </button>
                    )}
                  </div>

                  {showCommentInput && (
                    <div className="comment-input-container">
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Digite seu comentário..."
                        rows="3"
                      />
                      <div className="comment-actions">
                        <button 
                          className="comment-cancel-btn"
                          onClick={() => {
                            setShowCommentInput(false);
                            setComentario('');
                          }}
                        >
                          Cancelar
                        </button>
                        <button 
                          className="comment-submit-btn"
                          onClick={handleAddComment}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="comments-list">
                    {comentarios[selectedTask.id]?.map(comment => (
                      <div 
                        key={comment.data} 
                        className={`comment-item ${comment.tipo === 'comentario' ? 'user-comment' : 'system-log'}`}
                      >
                        <div className="comment-header">
                          <div className="comment-user-info">
                            {comment.tipo === 'comentario' ? (
                              <FontAwesomeIcon icon={faComment} className="comment-icon" />
                            ) : (
                              <FontAwesomeIcon icon={faHistory} className="log-icon" />
                            )}
                            <span className="comment-user">{comment.usuario}</span>
                          </div>
                          <span className="comment-date">
                            {format(new Date(comment.data), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        <p className="comment-text">
                          {comment.tipo === 'comentario' ? (
                            comment.detalhes
                          ) : (
                            <span className="log-message">{getLogMessage(comment)}</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Fechar
                </button>
                {selectedTask.status !== 'arquivado' && (
                  <>
                    <button 
                      type="button" 
                      className="delete-btn" 
                      onClick={handleDeleteTask}
                    >
                      Arquivar
                    </button>
                    <button 
                      type="button" 
                      className="edit-btn" 
                      onClick={handleEditFromView}
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {isDeleteTaskModalOpen && taskToDelete && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Arquivamento</h2>
              <p>Tem certeza que deseja arquivar a tarefa "{taskToDelete.titulo}"?</p>
              <div className="info-section">
                <p><strong>Responsável:</strong> {taskToDelete.responsavel}</p>
              </div>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteTaskModalOpen(false);
                    setTaskToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDeleteTask}
                >
                  Confirmar Arquivamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação para mover para outra etapa */}
        {isConfirmModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Completar Informações</h2>
              <p>Para mover esta tarefa para outra etapa, é necessrio preencher informações adicionais.</p>
              <p>Deseja preencher essas informações agora?</p>
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setIsConfirmModalOpen(false)}>
                  Cancelar
                </button>
                <button className="save-btn" onClick={handleConfirmMove}>
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteStageModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir a etapa "{stageToDelete?.name}"?</p>
              <div className="info-section">
                <p>As tarefas desta etapa serão movidas para "A Definir".</p>
                <p>Esta ação não pode ser desfeita.</p>
              </div>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteStageModalOpen(false);
                    setStageToDelete(null);
                    setIsEditStageModalOpen(true); // Retorna ao modal de edição
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDeleteStage}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Projeto */}
        {isEditProjectModalOpen && editingProject && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editar Projeto</h2>
              
              <div className="project-details-header">
                <div className="project-main-info">
                  <h3>{editingProject.nome}</h3>
                  <span className="project-type-badge">{editingProject.tipo}</span>
                </div>
                <div className="project-status">
                  <span className="status-badge">{editingProject.status || 'Em Andamento'}</span>
                </div>
              </div>

              <div className="project-details-grid">
                <div className="detail-item">
                  <label>Analista</label>
                  <span>{editingProject.analista}</span>
                </div>
                <div className="detail-item">
                  <label>Desenvolvedor</label>
                  <span>{editingProject.desenvolvedor}</span>
                </div>
                <div className="detail-item">
                  <label>Total de Tarefas</label>
                  <span>{getTotalTasks(editingProject)}</span>
                </div>
                <div className="detail-item">
                  <label>Cliente</label>
                  <span>{editingProject.cliente || 'Não definido'}</span>
                </div>
              </div>

              <div className="kanban-summary">
                <h4>Distribuição de Tarefas</h4>
                <div className="kanban-stats">
                  <div className="stat-item">
                    <label>A Definir</label>
                    <span>{editingProject.kanban?.aDefinir?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <label>Em Andamento</label>
                    <span>{editingProject.kanban?.inProgress?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <label>Concluídas</label>
                    <span>{editingProject.kanban?.done?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="delete-btn"
                  onClick={handleDeleteProject}
                >
                  <FontAwesomeIcon icon={faTrash} /> Excluir Projeto
                </button>
                <div className="modal-buttons-right">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditProjectModalOpen(false);
                      setEditingProject(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="save-btn"
                    onClick={() => {
                      setIsEditProjectModalOpen(false);
                      setEditingProject(null);
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão do Projeto */}
        {isDeleteProjectModalOpen && projectToDelete && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o projeto "{projectToDelete.nome}"?</p>
              <div className="info-section">
                <p><strong>Tipo:</strong> {projectToDelete.tipo}</p>
                <p><strong>Analista:</strong> {projectToDelete.analista}</p>
                <p><strong>Desenvolvedor:</strong> {projectToDelete.desenvolvedor}</p>
                <p><strong>Total de Tarefas:</strong> {getTotalTasks(projectToDelete)}</p>
                <p className="warning-text">Esta ação não pode ser desfeita.</p>
              </div>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteProjectModalOpen(false);
                    setProjectToDelete(null);
                    setIsEditProjectModalOpen(true); // Retorna ao modal de edição
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDeleteProject}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adicionar Projeto */}
        {isAddProjectModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header-with-action">
                <h2>Adicionar Projetos</h2>
                <button 
                  type="button" 
                  className="select-all-btn"
                  onClick={handleSelectAllProjects}
                >
                  {selectedProjectsToAdd.length === availableProjects.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>
              
              <div className="available-projects-list">
                {isLoadingProjects ? (
                  <div className="loading-projects">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Carregando projetos...</span>
                  </div>
                ) : loadError ? (
                  <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{loadError}</span>
                    <button 
                      className="retry-btn"
                      onClick={fetchAvailableProjects}
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : availableProjects.length === 0 ? (
                  <p className="no-projects-message">
                    Não há projetos disponíveis para adicionar.
                  </p>
                ) : (
                  availableProjects.map(project => (
                    <div 
                      key={project.id}
                      className={`available-project-card ${
                        selectedProjectsToAdd.some(p => p.id === project.id) ? 'selected' : ''
                      }`}
                      onClick={() => handleProjectSelection(project)}
                    >
                      <div className="project-card-header">
                        <h3>{project.nome}</h3>
                        <span className="project-type">{project.tipo}</span>
                      </div>
                      <div className="project-info">
                        <span>Analista: {project.analista}</span>
                        <span>Desenvolvedor: {project.desenvolvedor}</span>
                        <span>Status: {project.status}</span>
                      </div>
                      <div className="selection-indicator">
                        {selectedProjectsToAdd.some(p => p.id === project.id) && (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setIsAddProjectModalOpen(false);
                    setSelectedProjectsToAdd([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="save-btn"
                  onClick={handleAddProject}
                  disabled={!selectedProjectsToAdd.length || isLoadingProjects}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tarefa Arquivada */}
        {isArchivedTaskModalOpen && archivedTask && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="task-details">
                <div className="task-header">
                  <h2>{archivedTask.titulo}</h2>
                  {archivedTask.numeroChamado && (
                    <span className="task-chamado">Chamado: {archivedTask.numeroChamado}</span>
                  )}
                </div>

                {archivedTask.tags && archivedTask.tags.length > 0 && (
                  <div className="tags-container">
                    {archivedTask.tags.map(tag => (
                      <span 
                        key={tag.id} 
                        className="tag" 
                        style={{ backgroundColor: tag.cor }}
                      >
                        {tag.texto}
                      </span>
                    ))}
                  </div>
                )}

                <div className="task-info-cards">
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">person</i>
                      <h3>Responsáveis</h3>
                    </div>
                    <div className="info-card-content">
                      {Array.isArray(archivedTask.responsavel) ? 
                        archivedTask.responsavel.join(', ') : 
                        archivedTask.responsavel || 'Não atribuído'}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">event_available</i>
                      <h3>Data Arquivamento</h3>
                    </div>
                    <div className="info-card-content">
                      {archivedTask.arquivadoEm || 'Não definida'}
                    </div>
                  </div>
                </div>

                {archivedTask.content && (
                  <div className="task-description-section">
                    <div className="section-header">
                      <i className="material-icons">description</i>
                      <h3>Descrição</h3>
                    </div>
                    <div className="description-content">
                      <p>{archivedTask.content}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setIsArchivedTaskModalOpen(false)}
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  className="delete-btn" 
                  onClick={() => setIsConfirmDeleteArchivedTaskModalOpen(true)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão de Tarefa Arquivada */}
        {isConfirmDeleteArchivedTaskModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir a tarefa "{archivedTask?.titulo}" permanentemente?</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => setIsConfirmDeleteArchivedTaskModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDeleteArchivedTask}
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

export default Tarefas; 