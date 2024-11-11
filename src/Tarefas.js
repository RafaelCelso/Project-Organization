import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faClipboardList, faUser, faCalendarAlt, faExclamationTriangle, faSpinner, faCheckCircle, faProjectDiagram, faComment, faImage, faDownload, faSearch, faFilter, faTimes, faTag } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import './Tarefas.css';
import { format } from 'date-fns';

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
  const [selectedProject, setSelectedProject] = useState(null);
  const [projetos, setProjetos] = useState([
    { 
      id: 1, 
      nome: 'Projeto A', 
      tipo: 'SAC',
      analista: 'Ana Silva',
      desenvolvedor: 'Pedro Costa',
      kanban: {
        todo: [
          { 
            id: '1', 
            titulo: 'Implementar Login',
            content: 'Implementar nova feature de login com autenticação', 
            responsavel: 'João Santos',
            dataInicio: '2024-02-20',
            dataConclusao: '2024-02-25',
            prioridade: 'alta',
            progresso: 'nao_iniciada'
          }
        ],
        inProgress: [],
        testing: [],
        done: []
      }
    },
    { 
      id: 2, 
      nome: 'Projeto B', 
      tipo: 'OL',
      analista: 'João Santos',
      desenvolvedor: 'Maria Oliveira',
      kanban: {
        todo: [],
        inProgress: [],
        testing: [],
        done: []
      }
    },
  ]);

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
    prioridade: '',
    progresso: 'nao_iniciada',
    imagens: [],
    tags: [],
    numeroChamado: ''
  });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentarios, setComentarios] = useState([]);
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

  // Adicione a lista de responsáveis (você pode pegar isso do seu backend depois)
  const responsaveis = [
    { id: 1, nome: "Ana Silva" },
    { id: 2, nome: "João Santos" },
    { id: 3, nome: "Maria Oliveira" },
    { id: 4, nome: "Pedro Costa" }
  ];

  const handleAddComment = () => {
    if (comentario.trim()) {
      const novoComentario = {
        id: Date.now(),
        texto: comentario,
        usuario: 'Usuário Atual', // Substituir pelo usuário logado
        data: new Date(),
      };

      setComentarios([...comentarios, novoComentario]);
      setComentario('');
      setShowCommentInput(false);
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

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Se estiver movendo de "A Definir" para outra coluna (exceto Arquivado)
    if (source.droppableId === 'aDefinir' && 
        destination.droppableId !== 'aDefinir' && 
        destination.droppableId !== 'arquivado') {
      const sourceColumn = tasks[source.droppableId];
      const taskToMove = sourceColumn[source.index];
      
      setFormData({
        ...taskToMove,
        status: destination.droppableId
      });
      setTaskToUpdate(taskToMove);
      setIsConfirmModalOpen(true);
      return;
    }

    // Lógica para mover tarefas entre colunas
    const sourceColumn = Array.isArray(tasks[source.droppableId]) ? tasks[source.droppableId] : [];
    const destColumn = Array.isArray(tasks[destination.droppableId]) ? tasks[destination.droppableId] : [];
    
    const [removed] = sourceColumn.splice(source.index, 1);
    destColumn.splice(destination.index, 0, {
      ...removed,
      status: destination.droppableId
    });

    const newState = {
      ...tasks,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    };

    setTasks(newState);

    // Atualiza o projeto selecionado
    if (selectedProject) {
      const updatedProjetos = projetos.map(proj => {
        if (proj.id === selectedProject.id) {
          return {
            ...proj,
            kanban: newState
          };
        }
        return proj;
      });
      setProjetos(updatedProjetos);
    }
  };

  function handleSubmit(e) {
    e.preventDefault();

    // Incrementa o lastTaskId
    const newTaskId = lastTaskId + 1;
    
    const novaTarefa = {
      id: `task-${newTaskId}`, // Adiciona um prefixo para garantir que seja string
      taskId: newTaskId, // Mantém o número do ID para exibição
      titulo: formData.titulo,
      content: formData.content,
      responsavel: formData.responsavel,
      dataInicio: formData.dataInicio,
      dataConclusao: formData.dataConclusao,
      prioridade: formData.prioridade,
      progresso: formData.progresso || 'nao_iniciada',
      status: formData.status,
      tags: formData.tags || [],
      numeroChamado: formData.numeroChamado,
    };

    if (formData.id) {
      // Editar tarefa existente
      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        Object.keys(updatedTasks).forEach((key) => {
          updatedTasks[key] = updatedTasks[key].map((task) =>
            task.id === formData.id ? novaTarefa : task
          );
        });
        return updatedTasks;
      });
    } else {
      // Adicionar nova tarefa
      setTasks((prevTasks) => ({
        ...prevTasks,
        [formData.status]: [...(prevTasks[formData.status] || []), novaTarefa],
      }));
      
      // Atualiza o último ID usado
      setLastTaskId(newTaskId);
    }

    // Atualiza o projeto selecionado com as novas tarefas
    if (selectedProject) {
      const updatedProjetos = projetos.map(proj => {
        if (proj.id === selectedProject.id) {
          return {
            ...proj,
            kanban: {
              ...tasks,
              [formData.status]: [...(tasks[formData.status] || []), novaTarefa]
            }
          };
        }
        return proj;
      });
      setProjetos(updatedProjetos);
    }

    setIsModalOpen(false);
    clearFormAndImages(); // Usa a função existente para limpar o formulário
  }

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
    setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
    const isADefinirTask = selectedTask.status === 'aDefinir';
    
    if (isADefinirTask) {
      setFormData({
        id: selectedTask.id,
        taskId: selectedTask.taskId,
        titulo: selectedTask.titulo,
        content: selectedTask.content,
        status: 'aDefinir',
        imagens: selectedTask.imagens || [],
        tags: selectedTask.tags || [],
        numeroChamado: selectedTask.numeroChamado || ''
      });
    } else {
      setFormData({
        ...selectedTask,
        tags: selectedTask.tags || [],
        numeroChamado: selectedTask.numeroChamado || ''
      });
    }

    // Carrega as imagens existentes
    if (selectedTask.imagens && selectedTask.imagens.length > 0) {
      setUploadedFiles(selectedTask.imagens.map(imagem => ({
        id: imagem.id || Date.now(),
        url: imagem.url,
        name: imagem.name,
        type: imagem.type
      })));
    } else {
      setUploadedFiles([]);
    }

    setIsViewModalOpen(false);
    setIsEditing(true);
    setIsModalOpen(true);
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
      prioridade: '',
      progresso: 'nao_iniciada',
      imagens: [],
      tags: [],
      numeroChamado: ''
    });
    setUploadedFiles([]); // Limpa as imagens
  };

  const handleEdit = (task) => {
    setIsEditing(true);
    setFormData({
      ...formData,
      id: task.id,
      titulo: task.titulo,
      content: task.content,
      responsavel: task.responsavel,
      dataInicio: task.dataInicio || '',
      dataConclusao: task.dataConclusao || '',
      prioridade: task.prioridade || '',
      progresso: task.progresso || 'nao_iniciada',
      status: task.status || 'todo'
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
              <option value="">Selecione...</option>
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

  // Modal de confirmação para mover para outra etapa
  const handleConfirmMove = () => {
    setIsConfirmModalOpen(false);
    setIsModalOpen(true);
  };

  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    let resultado = {};
    
    Object.keys(tasks).forEach(coluna => {
      resultado[coluna] = tasks[coluna].filter(tarefa => {
        let passouFiltro = true;

        // Filtro por texto (nome, ID ou chamado)
        if (filtros.busca) {
          if (filtros.tipoBusca === 'nome') {
            passouFiltro = tarefa.titulo.toLowerCase().includes(filtros.busca.toLowerCase());
          } else if (filtros.tipoBusca === 'id') {
            passouFiltro = tarefa.taskId?.toString().includes(filtros.busca);
          } else if (filtros.tipoBusca === 'chamado') {
            passouFiltro = tarefa.numeroChamado?.toString().toLowerCase().includes(filtros.busca.toLowerCase());
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
          if (coluna === 'aDefinir') {
            passouFiltro = false;
          } else {
            passouFiltro = passouFiltro && tarefa.prioridade === filtros.prioridade;
          }
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
      tipoBusca: 'nome',
      prioridade: '',
      dataInicio: '',
      dataFim: '',
      tag: ''
    });
    setTarefasFiltradas(null);
  };

  // Adicionar função para lidar com o pressionamento de tecla
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  // Renderização dos filtros
  const renderFiltros = () => (
    <div className="filtros-container">
      <div className="filtros-grupo">
        <div className="filtro-busca">
          <select
            value={filtros.tipoBusca}
            onChange={(e) => setFiltros({...filtros, tipoBusca: e.target.value})}
            className="filtro-tipo-busca"
            onKeyPress={handleKeyPress}
          >
            <option value="nome">Nome</option>
            <option value="id">ID</option>
            <option value="chamado">Chamado</option>
          </select>
          <div className="busca-input-container">
            <FontAwesomeIcon icon={faSearch} className="busca-icon" />
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

        <div className="filtro-datas">
          <label>Período:</label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="Data Início"
          />
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            onKeyPress={handleKeyPress}
            placeholder="Data Fim"
          />
        </div>

        <div className="filtro-prioridade">
          <select
            value={filtros.prioridade}
            onChange={(e) => setFiltros({...filtros, prioridade: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todas as prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div className="filtro-tag">
          <select
            value={filtros.tag}
            onChange={(e) => setFiltros({...filtros, tag: e.target.value})}
            onKeyPress={handleKeyPress}
          >
            <option value="">Todas as tags</option>
            {availableTags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.texto}
              </option>
            ))}
          </select>
        </div>

        <div className="filtros-acoes">
          <button className="filtrar-btn" onClick={aplicarFiltros}>
            <FontAwesomeIcon icon={faFilter} /> Filtrar
          </button>
          <button className="limpar-filtros-btn" onClick={limparFiltros}>
            <FontAwesomeIcon icon={faTimes} /> Limpar
          </button>
        </div>
      </div>
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
          cor: corSelecionada // Usa a cor selecionada pelo usuário
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

  return (
    <div className="tarefas-container">
      <Sidebar />
      <div className="tarefas-content">
        <div className="header-with-button">
          <h1 className="page-title">Tarefas</h1>
        </div>

        {/* Cards de Projetos */}
        <div className="project-cards">
          {projetos.map(projeto => (
            <div 
              key={projeto.id} 
              className={`project-card ${selectedProject?.id === projeto.id ? 'selected' : ''}`}
              onClick={() => handleProjectSelect(projeto)}
            >
              <div className="project-card-header">
                <h3>{projeto.nome}</h3>
                <span className="project-type">{projeto.tipo}</span>
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
                      <label htmlFor="titulo">Título</label>
                      <input
                        type="text"
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Digite um título para a tarefa"
                      />
                    </div>
                  </div>

                  {/* Segunda linha - Responsável e Datas */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="responsavel">Responsável</label>
                      <select
                        id="responsavel"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {responsaveis.map((resp) => (
                          <option key={resp.id} value={resp.nome}>
                            {resp.nome}
                          </option>
                        ))}
                      </select>
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
                        <option value="">Selecione...</option>
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
                  <button type="button" className="cancel-btn" onClick={() => {
                    setIsModalOpen(false);
                    clearFormAndImages();
                  }}>
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
            <div className="modal-content view-modal">
              <div className="view-modal-header">
                <h2>{selectedTask.titulo}</h2>
                {selectedTask.numeroChamado && (
                  <div className="task-chamado modal">
                    <span className="chamado-label">Chamado:</span>
                    <span className="chamado-number">{selectedTask.numeroChamado}</span>
                  </div>
                )}
                <div className="task-badges">
                  <span className={`priority-badge priority-${formData.prioridade}`}>
                    {formData.prioridade ? formData.prioridade.charAt(0).toUpperCase() + formData.prioridade.slice(1) : 'Sem prioridade'}
                  </span>
                  <span className={`progress-badge progress-${formData.progresso}`}>
                    {formData.progresso === 'nao_iniciada' ? 'Não iniciada' :
                     formData.progresso === 'em_andamento' ? 'Em andamento' :
                     'Concluída'}
                  </span>
                </div>
              </div>

              <div className="view-modal-content">
                <div className="info-section">
                  <h3>Detalhes</h3>
                  <p>{selectedTask.content}</p>
                </div>

                {/* Seção de imagens */}
                {selectedTask.imagens && selectedTask.imagens.length > 0 && (
                  <div className="info-section">
                    <h3>Imagens</h3>
                    <div className="task-images-grid">
                      {selectedTask.imagens.map(imagem => (
                        <div key={imagem.id} className="task-image-item">
                          <img src={imagem.url} alt={imagem.name} />
                          <button 
                            className="download-image-btn"
                            onClick={() => handleDownloadImage(imagem.url, imagem.name)}
                            title="Fazer download"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="info-grid">
                  <div className="info-item">
                    <label>Responsável</label>
                    <span>{selectedTask.responsavel}</span>
                  </div>
                  <div className="info-item">
                    <label>Data de Início</label>
                    <span>{formData.dataInicio ? new Date(formData.dataInicio).toLocaleDateString() : 'Não definida'}</span>
                  </div>
                  <div className="info-item">
                    <label>Data de Conclusão</label>
                    <span>{formData.dataConclusao ? new Date(formData.dataConclusao).toLocaleDateString() : 'Não definida'}</span>
                  </div>
                </div>

                {/* Seção de Comentários */}
                <div className="comments-section">
                  <div className="comments-header">
                    <h3>Comentários</h3>
                    <button 
                      className="add-comment-btn"
                      onClick={() => setShowCommentInput(!showCommentInput)}
                    >
                      <FontAwesomeIcon icon={faComment} /> Comentar
                    </button>
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
                          className="cancel-btn"
                          onClick={() => {
                            setShowCommentInput(false);
                            setComentario('');
                          }}
                        >
                          Cancelar
                        </button>
                        <button 
                          className="save-btn"
                          onClick={handleAddComment}
                        >
                          Comentar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="comments-list">
                    {comentarios.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{comment.usuario}</span>
                          <span className="comment-date">
                            {format(comment.data, "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        <p className="comment-text">{comment.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsViewModalOpen(false)}>
                  Fechar
                </button>
                <button type="button" className="delete-btn" onClick={handleDeleteTask}>
                  Excluir
                </button>
                <button type="button" className="edit-btn" onClick={handleEditFromView}>
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {isDeleteTaskModalOpen && taskToDelete && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir a tarefa "{taskToDelete.titulo}"?</p>
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
                  Confirmar Exclusão
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
              <p>Para mover esta tarefa para outra etapa, é necessário preencher informações adicionais.</p>
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
      </div>
    </div>
  );
}

export default Tarefas; 