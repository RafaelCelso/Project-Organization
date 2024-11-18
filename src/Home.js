import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faTasks,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faProjectDiagram,
  faHashtag,
  faUsers,
  faComments,
  faComment,
  faHistory,
  faExchange,
} from "@fortawesome/free-solid-svg-icons";
import "./Home.css";
import { db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  doc,
} from "firebase/firestore";
import { format } from "date-fns";

function Home() {
  const navigate = useNavigate();
  const [showProjects, setShowProjects] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [indicadores, setIndicadores] = useState({
    realizadas: 0,
    vencidas: 0,
    concluidas: 0,
    emAndamento: 0,
  });
  const [totalProjetos, setTotalProjetos] = useState(0);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [allProjetos, setAllProjetos] = useState([]);
  const [projetosStats, setProjetosStats] = useState({
    total: 0,
    tipos: {},
    status: {},
  });
  const [filtroAtual, setFiltroAtual] = useState({
    tipo: null,
    status: null,
  });
  const [analistas, setAnalistas] = useState([]);
  const [analistasStats, setAnalistasStats] = useState({});
  const [showAnalistas, setShowAnalistas] = useState(false);
  const [analistaFiltrado, setAnalistaFiltrado] = useState(null);
  const [desenvolvedores, setDesenvolvedores] = useState([]);
  const [showDesenvolvedores, setShowDesenvolvedores] = useState(false);
  const [desenvolvedorFiltrado, setDesenvolvedorFiltrado] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentarios, setComentarios] = useState({});
  const [activeCommentTab, setActiveCommentTab] = useState('comentarios');
  const [tasks, setTasks] = useState({
    aDefinir: [],
    todo: [],
    inProgress: [],
    testing: [],
    prontoDeploy: [],
    done: [],
    arquivado: []
  });

  const loadProjetos = async () => {
    try {
      // Primeiro, busca os projetos básicos
      const projetosRef = collection(db, "projetos");
      const projetosSnapshot = await getDocs(projetosRef);
      
      // Depois, busca os dados do kanban
      const projetosTarefasRef = collection(db, "projetosTarefas");
      const projetosTarefasSnapshot = await getDocs(projetosTarefasRef);
      
      // Cria um mapa dos kanbans por projeto
      const kanbanPorProjeto = {};
      projetosTarefasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: []
          };
        }
      });

      // Mapeia os projetos com seus respectivos kanbans
      const projetosData = projetosSnapshot.docs.map(doc => {
        const projetoData = doc.data();
        const kanban = kanbanPorProjeto[doc.id] || {
          aDefinir: [],
          todo: [],
          inProgress: [],
          testing: [],
          prontoDeploy: [],
          done: [],
          arquivado: []
        };

        return {
          id: doc.id,
          ...projetoData,
          kanban
        };
      });

      // Atualiza os estados
      setAllProjetos(projetosData);
      setTotalProjetos(projetosData.length);

      // Calcula estatísticas
      const stats = {
        total: projetosData.length,
        tipos: {},
        status: {}
      };

      // Atualiza indicadores
      const novosIndicadores = {
        realizadas: 0,
        vencidas: 0,
        concluidas: 0,
        emAndamento: 0
      };

      // Agrupa projetos
      const projetosAgrupados = {
        concluidas: [],
        vencidas: [],
        emAndamento: []
      };

      projetosData.forEach(projeto => {
        // Atualiza stats
        const tipo = projeto.tipo || "Não definido";
        const status = projeto.status || "Em Andamento";
        stats.tipos[tipo] = (stats.tipos[tipo] || 0) + 1;
        stats.status[status] = (stats.status[status] || 0) + 1;

        // Atualiza indicadores baseado no kanban
        if (projeto.kanban) {
          novosIndicadores.concluidas += (projeto.kanban.done?.length || 0);
          novosIndicadores.emAndamento += (projeto.kanban.inProgress?.length || 0);
          novosIndicadores.realizadas += (projeto.kanban.done?.length || 0);

          // Verifica tarefas vencidas
          Object.values(projeto.kanban).forEach(coluna => {
            if (Array.isArray(coluna)) {
              coluna.forEach(tarefa => {
                if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
                  novosIndicadores.vencidas++;
                }
              });
            }
          });

          // Classifica o projeto
          const totalTarefas = 
            (projeto.kanban.todo?.length || 0) + 
            (projeto.kanban.inProgress?.length || 0) + 
            (projeto.kanban.done?.length || 0);
          
          const tarefasConcluidas = projeto.kanban.done?.length || 0;

          if (tarefasConcluidas === totalTarefas && totalTarefas > 0) {
            projetosAgrupados.concluidas.push(projeto);
          } else if (novosIndicadores.vencidas > 0) {
            projetosAgrupados.vencidas.push(projeto);
          } else {
            projetosAgrupados.emAndamento.push(projeto);
          }
        }
      });

      setProjetosStats(stats);
      setIndicadores(novosIndicadores);
      setProjetos(projetosAgrupados);

      // Log para debug
      console.log('Projetos carregados:', projetosData.map(p => ({
        id: p.id,
        nome: p.nome,
        kanban: p.kanban
      })));

    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const loadAnalistas = async () => {
    try {
      // Busca colaboradores que são analistas
      const colaboradoresRef = collection(db, 'colaboradores');
      const analistasQuery = query(colaboradoresRef, where("cargo", "==", "Analista"));
      const analistasSnapshot = await getDocs(analistasQuery);
      
      // Busca projetos e tarefas
      const projetosRef = collection(db, "projetos");
      const projetosTarefasRef = collection(db, "projetosTarefas");
      
      const [projetosSnapshot, projetosTarefasSnapshot] = await Promise.all([
        getDocs(projetosRef),
        getDocs(projetosTarefasRef)
      ]);

      // Cria mapa de tarefas por projeto
      const kanbanPorProjeto = {};
      projetosTarefasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: []
          };
        }
      });

      const analistasMap = new Map();

      // Inicializa dados dos analistas
      analistasSnapshot.docs.forEach(analistaDoc => {
        const analista = { id: analistaDoc.id, ...analistaDoc.data() };
        
        analistasMap.set(analista.id, {
          id: analista.id,
          nome: analista.nome,
          status: analista.status,
          projetos: [],
          stats: {
            total: 0,
            todo: 0,
            doing: 0,
            done: 0,
            vencidas: 0
          },
          tarefas: []
        });
      });

      // Processa projetos e suas tarefas
      projetosSnapshot.docs.forEach(doc => {
        const projeto = { id: doc.id, ...doc.data() };
        const kanban = kanbanPorProjeto[doc.id];

        // Verifica se o projeto tem um analista principal
        if (projeto.analistaPrincipal?.[0]?.value) {
          const analistaId = projeto.analistaPrincipal[0].value;
          const analistaData = analistasMap.get(analistaId);

          if (analistaData) {
            // Adiciona o projeto à lista do analista com seu kanban
            analistaData.projetos.push({
              ...projeto,
              kanban
            });

            // Processa as tarefas do kanban
            if (kanban) {
              // Função para processar tarefas de uma coluna
              const processarColuna = (tarefas, status) => {
                if (!Array.isArray(tarefas)) return;
                
                tarefas.forEach(tarefa => {
                  // Adiciona a tarefa à lista do analista
                  const tarefaProcessada = {
                    ...tarefa,
                    projetoNome: projeto.nome,
                    projetoId: projeto.id,
                    status
                  };
                  analistaData.tarefas.push(tarefaProcessada);

                  // Atualiza estatísticas
                  analistaData.stats.total++;

                  // Atualiza contadores específicos
                  if (['aDefinir', 'todo'].includes(status)) {
                    analistaData.stats.todo++;
                  } else if (['inProgress', 'testing', 'prontoDeploy'].includes(status)) {
                    analistaData.stats.doing++;
                  } else if (['done', 'arquivado'].includes(status)) {
                    analistaData.stats.done++;
                  }

                  // Verifica se está vencida
                  if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
                    analistaData.stats.vencidas++;
                  }
                });
              };

              // Processa cada coluna do kanban
              processarColuna(kanban.aDefinir, 'aDefinir');
              processarColuna(kanban.todo, 'todo');
              processarColuna(kanban.inProgress, 'inProgress');
              processarColuna(kanban.testing, 'testing');
              processarColuna(kanban.prontoDeploy, 'prontoDeploy');
              processarColuna(kanban.done, 'done');
              processarColuna(kanban.arquivado, 'arquivado');
            }
          }
        }
      });

      // Converte o Map em array e filtra apenas analistas ativos
      const analistasArray = Array.from(analistasMap.values())
        .filter(analista => analista.status === 'Ativo');
      
      setAnalistas(analistasArray);
      
      console.log('Dados dos analistas carregados:', analistasArray);

    } catch (error) {
      console.error("Erro ao carregar analistas:", error);
    }
  };

  const loadDesenvolvedores = async () => {
    try {
      // Busca colaboradores que são desenvolvedores
      const colaboradoresRef = collection(db, 'colaboradores');
      const desenvolvedoresQuery = query(colaboradoresRef, where("cargo", "==", "Desenvolvedor"));
      const desenvolvedoresSnapshot = await getDocs(desenvolvedoresQuery);
      
      // Busca projetos e tarefas
      const projetosRef = collection(db, "projetos");
      const projetosTarefasRef = collection(db, "projetosTarefas");
      
      const [projetosSnapshot, projetosTarefasSnapshot] = await Promise.all([
        getDocs(projetosRef),
        getDocs(projetosTarefasRef)
      ]);

      // Cria mapa de tarefas por projeto
      const kanbanPorProjeto = {};
      projetosTarefasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: []
          };
        }
      });

      const desenvolvedoresMap = new Map();

      // Inicializa dados dos desenvolvedores
      desenvolvedoresSnapshot.docs.forEach(devDoc => {
        const desenvolvedor = { id: devDoc.id, ...devDoc.data() };
        
        desenvolvedoresMap.set(desenvolvedor.id, {
          id: desenvolvedor.id,
          nome: desenvolvedor.nome,
          status: desenvolvedor.status,
          projetos: [],
          stats: {
            total: 0,
            todo: 0,
            doing: 0,
            done: 0,
            vencidas: 0
          },
          tarefas: []
        });
      });

      // Processa projetos e suas tarefas
      projetosSnapshot.docs.forEach(doc => {
        const projeto = { id: doc.id, ...doc.data() };
        const kanban = kanbanPorProjeto[doc.id];

        // Verifica se o projeto tem um desenvolvedor principal
        if (projeto.desenvolvedorPrincipal?.[0]?.value) {
          const devId = projeto.desenvolvedorPrincipal[0].value;
          const devData = desenvolvedoresMap.get(devId);

          if (devData) {
            // Adiciona o projeto à lista do desenvolvedor com seu kanban
            devData.projetos.push({
              ...projeto,
              kanban
            });

            // Processa as tarefas do kanban
            if (kanban) {
              const processarColuna = (tarefas, status) => {
                if (!Array.isArray(tarefas)) return;
                
                tarefas.forEach(tarefa => {
                  const tarefaProcessada = {
                    ...tarefa,
                    projetoNome: projeto.nome,
                    projetoId: projeto.id,
                    status
                  };
                  devData.tarefas.push(tarefaProcessada);

                  // Atualiza estatísticas
                  devData.stats.total++;

                  if (['aDefinir', 'todo'].includes(status)) {
                    devData.stats.todo++;
                  } else if (['inProgress', 'testing', 'prontoDeploy'].includes(status)) {
                    devData.stats.doing++;
                  } else if (['done', 'arquivado'].includes(status)) {
                    devData.stats.done++;
                  }

                  if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
                    devData.stats.vencidas++;
                  }
                });
              };

              // Processa cada coluna do kanban
              processarColuna(kanban.aDefinir, 'aDefinir');
              processarColuna(kanban.todo, 'todo');
              processarColuna(kanban.inProgress, 'inProgress');
              processarColuna(kanban.testing, 'testing');
              processarColuna(kanban.prontoDeploy, 'prontoDeploy');
              processarColuna(kanban.done, 'done');
              processarColuna(kanban.arquivado, 'arquivado');
            }
          }
        }
      });

      // Converte o Map em array e filtra apenas desenvolvedores ativos
      const desenvolvedoresArray = Array.from(desenvolvedoresMap.values())
        .filter(dev => dev.status === 'Ativo');
      
      setDesenvolvedores(desenvolvedoresArray);
      
      console.log('Dados dos desenvolvedores carregados:', desenvolvedoresArray);

    } catch (error) {
      console.error("Erro ao carregar desenvolvedores:", error);
    }
  };

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const eventosRef = collection(db, "eventos");
        const querySnapshot = await getDocs(eventosRef);

        const eventosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          start: new Date(doc.data().start),
          end: new Date(doc.data().end),
        }));

        // Filtra eventos do mês atual e futuros
        const eventosFiltrados = eventosData
          .filter((evento) => {
            const eventoData = new Date(evento.start);
            return (
              eventoData.getMonth() === hoje.getMonth() &&
              eventoData.getFullYear() === hoje.getFullYear() &&
              eventoData >= hoje
            );
          })
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        setEventos(eventosFiltrados);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      }
    };

    fetchEventos();
  }, []);

  useEffect(() => {
    loadProjetos();
  }, []);

  useEffect(() => {
    loadAnalistas();
  }, []);

  useEffect(() => {
    loadDesenvolvedores();
  }, []);

  const handleIndicadorClick = () => {
    setShowProjects(!showProjects);
  };

  const handleEventosClick = () => {
    navigate("/escalas");
  };

  const handleProjetosCardClick = () => {
    setShowAllProjects(!showAllProjects);
  };

  const handleIndicadorItemClick = (e, tipo, valor) => {
    e.stopPropagation();
    setShowAllProjects(true);
    setFiltroAtual({
      tipo: tipo === "tipo" ? valor : null,
      status: tipo === "status" ? valor : null,
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setComentarios({
      [task.id]: task.log || []
    });
    setIsViewModalOpen(true);
  };

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
        tipo: "comentario",
        data: new Date().toISOString(),
        usuario: "Usuário Atual",
        detalhes: comentario.trim()
      };

      // Encontra o projeto que contém a tarefa
      const projetoContendoTarefa = allProjetos.find(projeto => {
        return Object.values(projeto.kanban).some(coluna => 
          coluna.some(task => task.id === selectedTask.id)
        );
      });

      if (!projetoContendoTarefa) {
        throw new Error('Projeto não encontrado');
      }

      // Cria uma cópia atualizada da tarefa
      const tarefaAtualizada = {
        ...selectedTask,
        log: [...(selectedTask.log || []), novoComentario]
      };

      // Atualiza o Firebase
      const projetoRef = doc(db, 'projetosTarefas', projetoContendoTarefa.id);
      const novoKanban = { ...projetoContendoTarefa.kanban };
      
      // Encontra e atualiza a tarefa no kanban
      Object.keys(novoKanban).forEach(coluna => {
        novoKanban[coluna] = novoKanban[coluna].map(task => 
          task.id === selectedTask.id ? tarefaAtualizada : task
        );
      });

      // Atualiza o documento no Firebase
      await updateDoc(projetoRef, {
        kanban: novoKanban
      });

      // Atualiza os estados locais
      const projetosAtualizados = allProjetos.map(proj => 
        proj.id === projetoContendoTarefa.id 
          ? { ...proj, kanban: novoKanban }
          : proj
      );
      setAllProjetos(projetosAtualizados);
      setSelectedTask(tarefaAtualizada);
      
      // Atualiza o estado dos comentários
      setComentarios(prev => ({
        ...prev,
        [selectedTask.id]: tarefaAtualizada.log
      }));

      // Limpa o campo de comentário e fecha o input
      setComentario('');
      setShowCommentInput(false);

    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Por favor, tente novamente.');
    }
  };

  const renderTarefaCard = (tarefa) => (
    <div 
      key={tarefa.id} 
      className={`task-card ${tarefa.prioridade ? `prioridade-${tarefa.prioridade}` : ''}`}
      onClick={() => handleTaskClick(tarefa)}
    >
      <div className="task-header">
        <div className="task-id">
          <FontAwesomeIcon icon={faHashtag} className="id-icon" />
          {tarefa.taskId}
        </div>
        <div className="task-title">{tarefa.titulo}</div>
      </div>

      {tarefa.numeroChamado && (
        <div className="task-chamado">
          <span className="chamado-label">Chamado:</span>
          <span className="chamado-number">{tarefa.numeroChamado}</span>
        </div>
      )}

      <div className="task-content">{tarefa.descricao}</div>

      <div className="task-metadata">
        {tarefa.prioridade && (
          <span className={`task-priority priority-${tarefa.prioridade}`}>
            {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
          </span>
        )}

        {tarefa.tags && tarefa.tags.length > 0 && (
          <div className="task-tags-list">
            {tarefa.tags.map(tag => (
              <span 
                key={tag.id}
                className="task-tag"
                style={{ backgroundColor: tag.cor }}
              >
                {tag.texto}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="task-footer">
        <div className="task-assignee">
          {Array.isArray(tarefa.responsavel) 
            ? tarefa.responsavel.map(r => r.label || r).join(", ")
            : tarefa.responsavel?.label || tarefa.responsavel || "Não atribuído"
          }
        </div>
        
        <div className="task-dates">
          {tarefa.dataConclusao && (
            <div className={`task-date ${new Date(tarefa.dataConclusao) < new Date() ? 'vencida' : ''}`}>
              <span className="date-label">Conclusão:</span>
              <span>{format(new Date(tarefa.dataConclusao), 'dd/MM/yyyy')}</span>
            </div>
          )}
        </div>

        {tarefa.comentarios?.length > 0 && (
          <div className="task-chat-icon">
            <FontAwesomeIcon 
              icon={faComments} 
              className={`chat-icon ${tarefa.comentariosNaoLidos ? 'has-unread' : ''}`}
            />
            {tarefa.comentariosNaoLidos && <div className="unread-indicator" />}
          </div>
        )}
      </div>
    </div>
  );

  const renderProjetoCard = (projeto, statusClass) => {
    const tarefas = Object.values(projeto.kanban || {})
      .flat()
      .slice(0, 3);

    const getResponsavelNome = (responsavel) => {
      if (!responsavel) return "Não definido";
      if (typeof responsavel === "string") return responsavel;
      if (Array.isArray(responsavel)) {
        return responsavel.map((r) => r.label || r).join(", ");
      }
      return responsavel.label || responsavel.value || "Não definido";
    };

    return (
      <div
        key={projeto.id}
        className={`projeto-card ${statusClass}`}
        onClick={() => navigate(`/projetos/${projeto.id}`)}
      >
        <h5>{projeto.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">{projeto.tipo}</span>
          <span className="status">
            {statusClass === "success"
              ? "Concluído"
              : statusClass === "warning"
              ? "Vencido"
              : "Em Andamento"}
          </span>
        </div>
        <div className="responsavel">
          <span>
            Responsável: {getResponsavelNome(projeto.desenvolvedorPrincipal)}
          </span>
        </div>

        <div className="projeto-tarefas">
          <h6>Tarefas</h6>
          <div className="tarefas-list">
            {tarefas.map((tarefa) => renderTarefaCard(tarefa))}
          </div>
        </div>
      </div>
    );
  };

  const renderProjetoSimples = (projeto) => {
    const matchesFiltro =
      (!filtroAtual.tipo && !filtroAtual.status) ||
      (filtroAtual.tipo && projeto.tipo === filtroAtual.tipo) ||
      (filtroAtual.status && projeto.status === filtroAtual.status);

    if (!matchesFiltro) return null;

    return <ProjetoCard key={projeto.id} projeto={projeto} />;
  };

  const ProjetoCard = ({ projeto }) => {
    const calcularEstatisticas = () => {
      let todo = 0;
      let doing = 0;
      let done = 0;
      let vencidas = 0;
      let total = 0;

      // Verifica se o kanban existe
      if (projeto.kanban) {
        const kanban = projeto.kanban;

        // A Fazer
        if (Array.isArray(kanban.aDefinir)) {
          todo += kanban.aDefinir.length;
        }
        if (Array.isArray(kanban.todo)) {
          todo += kanban.todo.length;
        }

        // Em Andamento
        if (Array.isArray(kanban.inProgress)) {
          doing += kanban.inProgress.length;
        }
        if (Array.isArray(kanban.testing)) {
          doing += kanban.testing.length;
        }
        if (Array.isArray(kanban.prontoDeploy)) {
          doing += kanban.prontoDeploy.length;
        }

        // Concluídas
        if (Array.isArray(kanban.done)) {
          done += kanban.done.length;
        }
        if (Array.isArray(kanban.arquivado)) {
          done += kanban.arquivado.length;
        }

        // Conta tarefas vencidas em todas as colunas
        Object.values(kanban).forEach(coluna => {
          if (Array.isArray(coluna)) {
            coluna.forEach(tarefa => {
              if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
                vencidas++;
              }
            });
          }
        });

        // Calcula o total
        total = todo + doing + done;
      }

      return {
        total,
        todo,
        doing,
        done,
        vencidas
      };
    };

    const getResponsavelNome = (responsavel) => {
      if (!responsavel) return "Não definido";
      if (typeof responsavel === "string") return responsavel;
      if (Array.isArray(responsavel)) {
        return responsavel.map((r) => r.label || r).join(", ");
      }
      return responsavel.label || responsavel.value || "Não definido";
    };

    const stats = calcularEstatisticas();

    return (
      <div className="projeto-card">
        <h5>{projeto.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">{projeto.tipo || "Não definido"}</span>
          <span className="status">{projeto.status || "Em Andamento"}</span>
        </div>
        <div className="responsavel">
          <span>
            Responsável: {getResponsavelNome(projeto.analistaPrincipal)}
          </span>
        </div>

        <div className="kanban-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total de Tarefas</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.todo}</div>
              <div className="stat-label">A Definir/A Fazer</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.doing}</div>
              <div className="stat-label">Em Andamento/Teste/Deploy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.done}</div>
              <div className="stat-label">Concluídas/Arquivadas</div>
            </div>
            <div className="stat-item warning">
              <div className="stat-value">{stats.vencidas}</div>
              <div className="stat-label">Vencidas</div>
            </div>
          </div>

          <div className="progress-bars">
            <div className="progress-item">
              <div className="progress-header">
                <span>A Definir/A Fazer</span>
                <span>{((stats.todo / stats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill todo"
                  style={{ width: `${(stats.todo / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Em Andamento/Teste/Deploy</span>
                <span>{((stats.doing / stats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill doing"
                  style={{ width: `${(stats.doing / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Concluídas/Arquivadas</span>
                <span>{((stats.done / stats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill done"
                  style={{ width: `${(stats.done / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Vencidas</span>
                <span>{((stats.vencidas / stats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill warning"
                  style={{ width: `${(stats.vencidas / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalistaCard = (analista) => {
    const stats = analista.stats;
    const todoPercent = stats.total > 0 ? (stats.todo / stats.total) * 100 : 0;
    const doingPercent = stats.total > 0 ? (stats.doing / stats.total) * 100 : 0;
    const donePercent = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
    const vencidasPercent = stats.total > 0 ? (stats.vencidas / stats.total) * 100 : 0;

    // Ordena as tarefas por data de conclusão (vencidas primeiro)
    const tarefasOrdenadas = [...analista.tarefas].sort((a, b) => {
      if (a.dataConclusao && b.dataConclusao) {
        const dataA = new Date(a.dataConclusao);
        const dataB = new Date(b.dataConclusao);
        if (dataA < new Date() && dataB < new Date()) {
          return dataB - dataA; // Tarefas vencidas mais recentes primeiro
        }
        return dataA - dataB; // Tarefas não vencidas por data de conclusão
      }
      return 0;
    });

    return (
      <div key={analista.nome} className="projeto-card">
        <h5>{analista.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">Analista</span>
          <span className="status">{analista.projetos.length} projetos</span>
        </div>

        <div className="kanban-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total de Tarefas</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.todo}</div>
              <div className="stat-label">A Definir/A Fazer</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.doing}</div>
              <div className="stat-label">Em Andamento/Teste/Deploy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.done}</div>
              <div className="stat-label">Concluídas/Arquivadas</div>
            </div>
            <div className="stat-item warning">
              <div className="stat-value">{stats.vencidas}</div>
              <div className="stat-label">Vencidas</div>
            </div>
          </div>

          <div className="progress-bars">
            <div className="progress-item">
              <div className="progress-header">
                <span>A Definir/A Fazer</span>
                <span>{todoPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill todo" style={{ width: `${todoPercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Em Andamento/Teste/Deploy</span>
                <span>{doingPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill doing" style={{ width: `${doingPercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Concluídas/Arquivadas</span>
                <span>{donePercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill done" style={{ width: `${donePercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Vencidas</span>
                <span>{vencidasPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill warning" style={{ width: `${vencidasPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Lista de Tarefas */}
          <div className="projeto-tarefas">
            <h6>Tarefas Recentes</h6>
            <div className="tarefas-list">
              {tarefasOrdenadas.slice(0, 5).map((tarefa) => (
                <div 
                  key={tarefa.id} 
                  className={`tarefa-card ${
                    tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date() 
                      ? 'vencida' 
                      : `prioridade-${tarefa.prioridade?.toLowerCase()}`
                  }`}
                >
                  <div className="tarefa-header">
                    <div className="tarefa-id-titulo">
                      <span className="tarefa-id">
                        <FontAwesomeIcon icon={faHashtag} className="id-icon" />
                        {tarefa.taskId}
                      </span>
                      <span className="tarefa-titulo">{tarefa.titulo}</span>
                    </div>
                    <span className={`tarefa-status status-${tarefa.status}`}>
                      {tarefa.status === 'todo' ? 'A Fazer' :
                       tarefa.status === 'inProgress' ? 'Em Andamento' :
                       tarefa.status === 'done' ? 'Concluído' :
                       tarefa.status === 'testing' ? 'Em Teste' :
                       tarefa.status === 'prontoDeploy' ? 'Pronto Deploy' :
                       tarefa.status}
                    </span>
                  </div>
                  <div className="tarefa-footer">
                    <span className="tarefa-projeto">{tarefa.projetoNome}</span>
                    {tarefa.dataConclusao && (
                      <span className={`tarefa-data ${
                        new Date(tarefa.dataConclusao) < new Date() ? 'vencida' : ''
                      }`}>
                        {format(new Date(tarefa.dataConclusao), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {tarefa.tags && tarefa.tags.length > 0 && (
                    <div className="tarefa-tags">
                      {tarefa.tags.map(tag => (
                        <span 
                          key={tag.id}
                          className="tag-mini"
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.texto}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalistasCard = () => (
    <div className={`card ${showAnalistas ? "expanded" : ""}`} onClick={() => setShowAnalistas(!showAnalistas)}>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Analistas
      </h2>
      <div className="indicadores">
        <div className="indicador">
          <FontAwesomeIcon icon={faUsers} className="icon success" />
          <span>Total de Analistas: {analistas.length}</span>
        </div>

        <div className="indicador-grupo">
          <h3>Filtrar por Analista:</h3>
          {analistas.map((analista) => (
            <div
              key={analista.nome}
              className={`indicador-item ${analistaFiltrado === analista.nome ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setAnalistaFiltrado(analistaFiltrado === analista.nome ? null : analista.nome);
                setShowAnalistas(true);
              }}
            >
              <span>{analista.nome}</span>
              <span>{analista.projetos.length} projetos</span>
            </div>
          ))}
        </div>

        {analistaFiltrado && (
          <div
            className="indicador limpar-filtro"
            onClick={(e) => {
              e.stopPropagation();
              setAnalistaFiltrado(null);
            }}
          >
            <small>Limpar filtro</small>
          </div>
        )}

        {showAnalistas && (
          <div className="indicador">
            <small>Clique para ver os detalhes dos analistas</small>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesenvolvedorCard = (desenvolvedor) => {
    const stats = desenvolvedor.stats;
    const todoPercent = stats.total > 0 ? (stats.todo / stats.total) * 100 : 0;
    const doingPercent = stats.total > 0 ? (stats.doing / stats.total) * 100 : 0;
    const donePercent = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
    const vencidasPercent = stats.total > 0 ? (stats.vencidas / stats.total) * 100 : 0;

    // Ordena as tarefas por data de conclusão (vencidas primeiro)
    const tarefasOrdenadas = [...desenvolvedor.tarefas].sort((a, b) => {
      if (a.dataConclusao && b.dataConclusao) {
        const dataA = new Date(a.dataConclusao);
        const dataB = new Date(b.dataConclusao);
        if (dataA < new Date() && dataB < new Date()) {
          return dataB - dataA; // Tarefas vencidas mais recentes primeiro
        }
        return dataA - dataB; // Tarefas não vencidas por data de conclusão
      }
      return 0;
    });

    return (
      <div key={desenvolvedor.nome} className="projeto-card">
        <h5>{desenvolvedor.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">Desenvolvedor</span>
          <span className="status">{desenvolvedor.projetos.length} projetos</span>
        </div>

        <div className="kanban-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total de Tarefas</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.todo}</div>
              <div className="stat-label">A Definir/A Fazer</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.doing}</div>
              <div className="stat-label">Em Andamento/Teste/Deploy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.done}</div>
              <div className="stat-label">Concluídas/Arquivadas</div>
            </div>
            <div className="stat-item warning">
              <div className="stat-value">{stats.vencidas}</div>
              <div className="stat-label">Vencidas</div>
            </div>
          </div>

          <div className="progress-bars">
            <div className="progress-item">
              <div className="progress-header">
                <span>A Definir/A Fazer</span>
                <span>{todoPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill todo" style={{ width: `${todoPercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Em Andamento/Teste/Deploy</span>
                <span>{doingPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill doing" style={{ width: `${doingPercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Concluídas/Arquivadas</span>
                <span>{donePercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill done" style={{ width: `${donePercent}%` }} />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Vencidas</span>
                <span>{vencidasPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill warning" style={{ width: `${vencidasPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Lista de Tarefas */}
          <div className="projeto-tarefas">
            <h6>Tarefas Recentes</h6>
            <div className="tarefas-list">
              {tarefasOrdenadas.slice(0, 5).map((tarefa) => (
                <div 
                  key={tarefa.id} 
                  className={`tarefa-card ${
                    tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date() 
                      ? 'vencida' 
                      : `prioridade-${tarefa.prioridade?.toLowerCase()}`
                  }`}
                >
                  <div className="tarefa-header">
                    <div className="tarefa-id-titulo">
                      <span className="tarefa-id">
                        <FontAwesomeIcon icon={faHashtag} className="id-icon" />
                        {tarefa.taskId}
                      </span>
                      <span className="tarefa-titulo">{tarefa.titulo}</span>
                    </div>
                    <span className={`tarefa-status status-${tarefa.status}`}>
                      {tarefa.status === 'todo' ? 'A Fazer' :
                       tarefa.status === 'inProgress' ? 'Em Andamento' :
                       tarefa.status === 'done' ? 'Concluído' :
                       tarefa.status === 'testing' ? 'Em Teste' :
                       tarefa.status === 'prontoDeploy' ? 'Pronto Deploy' :
                       tarefa.status}
                    </span>
                  </div>
                  <div className="tarefa-footer">
                    <span className="tarefa-projeto">{tarefa.projetoNome}</span>
                    {tarefa.dataConclusao && (
                      <span className={`tarefa-data ${
                        new Date(tarefa.dataConclusao) < new Date() ? 'vencida' : ''
                      }`}>
                        {format(new Date(tarefa.dataConclusao), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {tarefa.tags && tarefa.tags.length > 0 && (
                    <div className="tarefa-tags">
                      {tarefa.tags.map(tag => (
                        <span 
                          key={tag.id}
                          className="tag-mini"
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.texto}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDesenvolvedoresCard = () => (
    <div className={`card ${showDesenvolvedores ? "expanded" : ""}`} onClick={() => setShowDesenvolvedores(!showDesenvolvedores)}>
      <h2>
        <FontAwesomeIcon icon={faUsers} /> Desenvolvedores
      </h2>
      <div className="indicadores">
        <div className="indicador">
          <FontAwesomeIcon icon={faUsers} className="icon success" />
          <span>Total de Desenvolvedores: {desenvolvedores.length}</span>
        </div>

        <div className="indicador-grupo">
          <h3>Filtrar por Desenvolvedor:</h3>
          {desenvolvedores.map((dev) => (
            <div
              key={dev.nome}
              className={`indicador-item ${desenvolvedorFiltrado === dev.nome ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setDesenvolvedorFiltrado(desenvolvedorFiltrado === dev.nome ? null : dev.nome);
                setShowDesenvolvedores(true);
              }}
            >
              <span>{dev.nome}</span>
              <span>{dev.projetos.length} projetos</span>
            </div>
          ))}
        </div>

        {desenvolvedorFiltrado && (
          <div
            className="indicador limpar-filtro"
            onClick={(e) => {
              e.stopPropagation();
              setDesenvolvedorFiltrado(null);
            }}
          >
            <small>Limpar filtro</small>
          </div>
        )}

        {showDesenvolvedores && (
          <div className="indicador">
            <small>Clique para ver os detalhes dos desenvolvedores</small>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalistasSection = () => {
    const analistasParaMostrar = analistaFiltrado
      ? analistas.filter(analista => analista.nome === analistaFiltrado)
      : analistas;

    return (
      <div className="projetos-relacionados">
        <div className="projetos-section">
          <h3>
            <FontAwesomeIcon icon={faUsers} /> 
            {analistaFiltrado ? `Visão do Analista: ${analistaFiltrado}` : 'Visão por Analista'}
          </h3>
          <div className="projetos-grid">
            {analistasParaMostrar.length > 0 ? (
              analistasParaMostrar.map(analista => renderAnalistaCard(analista))
            ) : (
              <p className="no-projects">Nenhum analista encontrado</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDesenvolvedoresSection = () => {
    const devsParaMostrar = desenvolvedorFiltrado
      ? desenvolvedores.filter(dev => dev.nome === desenvolvedorFiltrado)
      : desenvolvedores;

    return (
      <div className="projetos-relacionados">
        <div className="projetos-section">
          <h3>
            <FontAwesomeIcon icon={faUsers} /> 
            {desenvolvedorFiltrado ? `Visão do Desenvolvedor: ${desenvolvedorFiltrado}` : 'Visão por Desenvolvedor'}
          </h3>
          <div className="projetos-grid">
            {devsParaMostrar.length > 0 ? (
              devsParaMostrar.map(dev => renderDesenvolvedorCard(dev))
            ) : (
              <p className="no-projects">Nenhum desenvolvedor encontrado</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderKanbanGeral = () => {
    const colunas = {
      aDefinir: { titulo: 'A Definir', cor: '#6366f1' },
      todo: { titulo: 'A Fazer', cor: '#8b5cf6' },
      inProgress: { titulo: 'Em Andamento', cor: '#2196f3' },
      testing: { titulo: 'Em Teste', cor: '#f59e0b' },
      prontoDeploy: { titulo: 'Pronto para Deploy', cor: '#10b981' },
      done: { titulo: 'Concluído', cor: '#4caf50' },
      arquivado: { titulo: 'Arquivado', cor: '#6b7280' }
    };

    const projetosPorColuna = {};
    
    // Inicializa as colunas
    Object.keys(colunas).forEach(coluna => {
      projetosPorColuna[coluna] = [];
    });

    // Organiza os projetos por coluna
    allProjetos.forEach(projeto => {
      Object.entries(colunas).forEach(([key, _]) => {
        if (projeto.kanban?.[key]?.length > 0) {
          projetosPorColuna[key].push({
            ...projeto,
            tarefas: projeto.kanban[key]
          });
        }
      });
    });

    return (
      <div className="kanban-board">
        {Object.entries(colunas).map(([key, coluna]) => {
          const projetosDaColuna = projetosPorColuna[key];
          
          if (projetosDaColuna.length === 0) return null;

          return (
            <div key={key} className="kanban-coluna-container">
              <div className="kanban-coluna-header" style={{ borderColor: coluna.cor }}>
                <h4 style={{ color: coluna.cor }}>{coluna.titulo}</h4>
                <span className="coluna-contador">{projetosDaColuna.reduce((total, p) => total + p.tarefas.length, 0)} tarefas</span>
              </div>
              <div className="kanban-coluna-content">
                {projetosDaColuna.map(projeto => (
                  <div key={`${key}-${projeto.id}`} className="projeto-card-kanban">
                    <div className="projeto-card-header">
                      <h5>{projeto.nome}</h5>
                      <span className="tipo-badge">{projeto.tipo || "Não definido"}</span>
                    </div>
                    <div className="tarefas-list">
                      {projeto.tarefas.map(tarefa => renderTarefaCard(tarefa))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content">
        <h1 className="page-title">Início</h1>

        <div className="cards-container">
          <div className="card" onClick={handleEventosClick}>
            <h2>
              <FontAwesomeIcon icon={faCalendarAlt} /> Próximos Eventos
            </h2>
            <ul>
              {eventos.length > 0 ? (
                eventos.map((evento) => (
                  <li key={evento.id}>
                    <span>{evento.title}</span>
                    <span>{format(new Date(evento.start), "dd/MM/yyyy")}</span>
                  </li>
                ))
              ) : (
                <li className="no-events">
                  <span>Nenhum evento próximo</span>
                </li>
              )}
            </ul>
          </div>

          <div
            className={`card ${showProjects ? "expanded" : ""}`}
            onClick={handleIndicadorClick}
          >
            <h2>
              <FontAwesomeIcon icon={faTasks} /> Indicadores de Tarefas
            </h2>
            <div className="indicadores">
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="icon success"
                />
                <span>Concluídas: {indicadores.concluidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="icon warning"
                />
                <span>Vencidas: {indicadores.vencidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faSpinner} className="icon spin" />
                <span>Em Andamento: {indicadores.emAndamento}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="icon success"
                />
                <span>Realizadas: {indicadores.realizadas}</span>
              </div>
            </div>
          </div>

          <div
            className={`card ${showAllProjects ? "expanded" : ""}`}
            onClick={handleProjetosCardClick}
          >
            <h2>
              <FontAwesomeIcon icon={faProjectDiagram} /> Projetos Cadastrados
            </h2>
            <div className="indicadores">
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faProjectDiagram}
                  className="icon success"
                />
                <span>Total de Projetos: {projetosStats.total}</span>
              </div>

              <div className="indicador-grupo">
                <h3>Por Tipo:</h3>
                {Object.entries(projetosStats.tipos).map(([tipo, count]) => (
                  <div
                    key={tipo}
                    className={`indicador-item ${
                      filtroAtual.tipo === tipo ? "active" : ""
                    }`}
                    onClick={(e) => handleIndicadorItemClick(e, "tipo", tipo)}
                  >
                    <span>{tipo}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>

              <div className="indicador-grupo">
                <h3>Por Status:</h3>
                {Object.entries(projetosStats.status).map(([status, count]) => (
                  <div
                    key={status}
                    className={`indicador-item ${
                      filtroAtual.status === status ? "active" : ""
                    }`}
                    onClick={(e) =>
                      handleIndicadorItemClick(e, "status", status)
                    }
                  >
                    <span>{status}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>

              {(filtroAtual.tipo || filtroAtual.status) && (
                <div
                  className="indicador limpar-filtro"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiltroAtual({ tipo: null, status: null });
                  }}
                >
                  <small>Limpar filtros</small>
                </div>
              )}

              {showAllProjects && (
                <div className="indicador">
                  <small>Clique para ver os detalhes dos projetos</small>
                </div>
              )}
            </div>
          </div>

          {renderAnalistasCard()}
          {renderDesenvolvedoresCard()}
        </div>

        {showProjects && (
          <div className="projetos-relacionados">
            <div className="projetos-section">
              <h3>
                <FontAwesomeIcon icon={faProjectDiagram} /> Visão Geral do Kanban
              </h3>
              {renderKanbanGeral()}
            </div>
          </div>
        )}

        {showAllProjects && (
          <div className="projetos-relacionados">
            <div className="projetos-section">
              <h3>
                <FontAwesomeIcon icon={faProjectDiagram} />
                {filtroAtual.tipo
                  ? ` Projetos do tipo: ${filtroAtual.tipo}`
                  : filtroAtual.status
                  ? ` Projetos com status: ${filtroAtual.status}`
                  : " Todos os Projetos"}
              </h3>
              <div className="projetos-grid">
                {allProjetos.length > 0 ? (
                  allProjetos.map((projeto) => renderProjetoSimples(projeto))
                ) : (
                  <p className="no-projects">Nenhum projeto cadastrado</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showAnalistas && renderAnalistasSection()}
        {showDesenvolvedores && renderDesenvolvedoresSection()}

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
                      {selectedTask.dataConclusao ? 
                        format(new Date(selectedTask.dataConclusao + 'T00:00:00'), 'dd/MM/yyyy') 
                        : 'Não definida'}
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
                    <div className="comments-tabs">
                      <button 
                        className={`tab-button ${activeCommentTab === 'comentarios' ? 'active' : ''}`}
                        onClick={() => setActiveCommentTab('comentarios')}
                      >
                        <FontAwesomeIcon icon={faComment} />
                        Comentários
                      </button>
                      <button 
                        className={`tab-button ${activeCommentTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveCommentTab('logs')}
                      >
                        <FontAwesomeIcon icon={faHistory} />
                        Logs
                      </button>
                    </div>
                    {activeCommentTab === 'comentarios' && selectedTask.status !== 'arquivado' && (
                      <button 
                        className="add-comment-btn"
                        onClick={() => setShowCommentInput(!showCommentInput)}
                      >
                        <FontAwesomeIcon icon={faComment} />
                        Comentar
                      </button>
                    )}
                  </div>

                  {activeCommentTab === 'comentarios' && (
                    <>
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

                      {/* Lista de Comentários */}
                      <div className="comments-list">
                        {comentarios[selectedTask.id]
                          ?.filter(comment => comment.tipo === 'comentario')
                          .sort((a, b) => new Date(b.data) - new Date(a.data))
                          .map(comment => (
                            <div 
                              key={comment.data} 
                              className="comment-item user-comment"
                            >
                              <div className="comment-header">
                                <div className="comment-user-info">
                                  <FontAwesomeIcon icon={faComment} className="comment-icon" />
                                  <span className="comment-user">{comment.usuario}</span>
                                </div>
                                <span className="comment-date">
                                  {format(new Date(comment.data), "dd/MM/yyyy 'às' HH:mm")}
                                </span>
                              </div>
                              <p className="comment-text">{comment.detalhes}</p>
                            </div>
                          ))}
                      </div>
                    </>
                  )}

                  {activeCommentTab === 'logs' && (
                    <div className="comments-list">
                      {comentarios[selectedTask.id]
                        ?.filter(comment => comment.tipo !== 'comentario')
                        .sort((a, b) => new Date(b.data) - new Date(a.data))
                        .map(log => (
                          <div 
                            key={log.data} 
                            className={`comment-item system-log ${log.tipo === 'teste' ? 'teste-log' : ''}`}
                          >
                            <div className="comment-header">
                              <div className="comment-user-info">
                                <FontAwesomeIcon 
                                  icon={
                                    log.tipo === 'teste' ? faCheckCircle :
                                    log.tipo === 'movimentacao' ? faExchange :
                                    faHistory
                                  } 
                                  className="log-icon" 
                                />
                                <span className="comment-user">{log.usuario}</span>
                              </div>
                              <span className="comment-date">
                                {format(new Date(log.data), "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                            </div>
                            <p className="log-message">{getLogMessage(log)}</p>
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
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
