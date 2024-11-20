import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  faArchive,
  faFileExcel,
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
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
} from "chart.js";
import { Pie, Bar, Line, Radar } from "react-chartjs-2";
import * as XLSX from 'xlsx';

// Atualize o registro do ChartJS
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

function Home() {
  const navigate = useNavigate();
  const [showProjects, setShowProjects] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [indicadores, setIndicadores] = useState({
    aDefinir: 0,
    todo: 0,
    inProgress: 0,
    testing: 0,
    prontoDeploy: 0,
    done: 0,
    arquivado: 0,
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
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState({});
  const [activeCommentTab, setActiveCommentTab] = useState("comentarios");
  const [tasks, setTasks] = useState({
    aDefinir: [],
    todo: [],
    inProgress: [],
    testing: [],
    prontoDeploy: [],
    done: [],
    arquivado: [],
  });
  const [expandedCard, setExpandedCard] = useState(null); // 'projects', 'analistas', 'desenvolvedores', ou null
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [expandedAnalistas, setExpandedAnalistas] = useState(new Set());
  const [expandedDesenvolvedores, setExpandedDesenvolvedores] = useState(new Set());

  // Adicione estas configurações logo após a declaração dos estados no início do componente

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        displayColors: true,
        boxPadding: 6,
      },
    },
  };

  const barOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 10,
        },
      },
    },
  };

  const pieOptions = {
    ...commonOptions,
    cutout: "60%",
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false,
      },
    },
  };

  const lineOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const lineData = {
    labels: [
      "A Definir",
      "A Fazer",
      "Em Andamento",
      "Em Teste",
      "Pronto Deploy",
      "Concluído",
    ],
    datasets: [
      {
        label: "Fluxo de Tarefas",
        data: [
          indicadores.aDefinir,
          indicadores.todo,
          indicadores.inProgress,
          indicadores.testing,
          indicadores.prontoDeploy,
          indicadores.done,
        ],
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#2196f3",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

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
      projetosTarefasSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: [],
          };
        }
      });

      // Mapeia os projetos com seus respectivos kanbans
      const projetosData = projetosSnapshot.docs.map((doc) => {
        const projetoData = doc.data();
        const kanban = kanbanPorProjeto[doc.id] || {
          aDefinir: [],
          todo: [],
          inProgress: [],
          testing: [],
          prontoDeploy: [],
          done: [],
          arquivado: [],
        };

        return {
          id: doc.id,
          ...projetoData,
          kanban,
        };
      });

      // Atualiza os estados
      setAllProjetos(projetosData);
      setTotalProjetos(projetosData.length);

      // Calcula estatísticas
      const stats = {
        total: projetosData.length,
        tipos: {},
        status: {},
      };

      // Atualiza indicadores baseado no kanban
      const novosIndicadores = {
        aDefinir: 0,
        todo: 0,
        inProgress: 0,
        testing: 0,
        prontoDeploy: 0,
        done: 0,
        arquivado: 0,
      };

      // Agrupa projetos
      const projetosAgrupados = {
        concluidas: [],
        vencidas: [],
        emAndamento: [],
      };

      projetosData.forEach((projeto) => {
        // Atualiza stats
        const tipo = projeto.tipo || "Não definido";
        const status = projeto.status || "Em Andamento";
        stats.tipos[tipo] = (stats.tipos[tipo] || 0) + 1;
        stats.status[status] = (stats.status[status] || 0) + 1;

        // Atualiza indicadores baseado no kanban
        if (projeto.kanban) {
          novosIndicadores.aDefinir += projeto.kanban.aDefinir?.length || 0;
          novosIndicadores.todo += projeto.kanban.todo?.length || 0;
          novosIndicadores.inProgress += projeto.kanban.inProgress?.length || 0;
          novosIndicadores.testing += projeto.kanban.testing?.length || 0;
          novosIndicadores.prontoDeploy +=
            projeto.kanban.prontoDeploy?.length || 0;
          novosIndicadores.done += projeto.kanban.done?.length || 0;
          novosIndicadores.arquivado += projeto.kanban.arquivado?.length || 0;

          // Verifica tarefas vencidas
          Object.values(projeto.kanban).forEach((coluna) => {
            if (Array.isArray(coluna)) {
              coluna.forEach((tarefa) => {
                if (
                  tarefa.dataConclusao &&
                  new Date(tarefa.dataConclusao) < new Date()
                ) {
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
      console.log(
        "Projetos carregados:",
        projetosData.map((p) => ({
          id: p.id,
          nome: p.nome,
          kanban: p.kanban,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const loadAnalistas = async () => {
    try {
      // Busca colaboradores que são analistas
      const colaboradoresRef = collection(db, "colaboradores");
      const analistasQuery = query(
        colaboradoresRef,
        where("cargo", "==", "Analista")
      );
      const analistasSnapshot = await getDocs(analistasQuery);

      // Busca projetos e tarefas
      const projetosRef = collection(db, "projetos");
      const projetosTarefasRef = collection(db, "projetosTarefas");

      const [projetosSnapshot, projetosTarefasSnapshot] = await Promise.all([
        getDocs(projetosRef),
        getDocs(projetosTarefasRef),
      ]);

      // Cria mapa de tarefas por projeto
      const kanbanPorProjeto = {};
      projetosTarefasSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: [],
          };
        }
      });

      const analistasMap = new Map();

      // Inicializa dados dos analistas
      analistasSnapshot.docs.forEach((analistaDoc) => {
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
            vencidas: 0,
          },
          tarefas: [],
        });
      });

      // Processa projetos e suas tarefas
      projetosSnapshot.docs.forEach((doc) => {
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
              kanban,
            });

            // Processa as tarefas do kanban
            if (kanban) {
              // Função para processar tarefas de uma coluna
              const processarColuna = (tarefas, status) => {
                if (!Array.isArray(tarefas)) return;

                tarefas.forEach((tarefa) => {
                  // Adiciona a tarefa à lista do analista
                  const tarefaProcessada = {
                    ...tarefa,
                    projetoNome: projeto.nome,
                    projetoId: projeto.id,
                    status,
                  };
                  analistaData.tarefas.push(tarefaProcessada);

                  // Atualiza estatísticas
                  analistaData.stats.total++;

                  // Atualiza contadores específicos
                  if (["aDefinir", "todo"].includes(status)) {
                    analistaData.stats.todo++;
                  } else if (
                    ["inProgress", "testing", "prontoDeploy"].includes(status)
                  ) {
                    analistaData.stats.doing++;
                  } else if (["done", "arquivado"].includes(status)) {
                    analistaData.stats.done++;
                  }

                  // Verifica se está vencida
                  if (
                    tarefa.dataConclusao &&
                    new Date(tarefa.dataConclusao) < new Date()
                  ) {
                    analistaData.stats.vencidas++;
                  }
                });
              };

              // Processa cada coluna do kanban
              processarColuna(kanban.aDefinir, "aDefinir");
              processarColuna(kanban.todo, "todo");
              processarColuna(kanban.inProgress, "inProgress");
              processarColuna(kanban.testing, "testing");
              processarColuna(kanban.prontoDeploy, "prontoDeploy");
              processarColuna(kanban.done, "done");
              processarColuna(kanban.arquivado, "arquivado");
            }
          }
        }
      });

      // Converte o Map em array e filtra apenas analistas ativos
      const analistasArray = Array.from(analistasMap.values()).filter(
        (analista) => analista.status === "Ativo"
      );

      setAnalistas(analistasArray);

      console.log("Dados dos analistas carregados:", analistasArray);
    } catch (error) {
      console.error("Erro ao carregar analistas:", error);
    }
  };

  const loadDesenvolvedores = async () => {
    try {
      // Busca colaboradores que são desenvolvedores
      const colaboradoresRef = collection(db, "colaboradores");
      const desenvolvedoresQuery = query(
        colaboradoresRef,
        where("cargo", "==", "Desenvolvedor")
      );
      const desenvolvedoresSnapshot = await getDocs(desenvolvedoresQuery);

      // Busca projetos e tarefas
      const projetosRef = collection(db, "projetos");
      const projetosTarefasRef = collection(db, "projetosTarefas");

      const [projetosSnapshot, projetosTarefasSnapshot] = await Promise.all([
        getDocs(projetosRef),
        getDocs(projetosTarefasRef),
      ]);

      // Cria mapa de tarefas por projeto
      const kanbanPorProjeto = {};
      projetosTarefasSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.projetoId) {
          kanbanPorProjeto[data.projetoId] = data.kanban || {
            aDefinir: [],
            todo: [],
            inProgress: [],
            testing: [],
            prontoDeploy: [],
            done: [],
            arquivado: [],
          };
        }
      });

      const desenvolvedoresMap = new Map();

      // Inicializa dados dos desenvolvedores
      desenvolvedoresSnapshot.docs.forEach((devDoc) => {
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
            vencidas: 0,
          },
          tarefas: [],
        });
      });

      // Processa projetos e suas tarefas
      projetosSnapshot.docs.forEach((doc) => {
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
              kanban,
            });

            // Processa as tarefas do kanban
            if (kanban) {
              const processarColuna = (tarefas, status) => {
                if (!Array.isArray(tarefas)) return;

                tarefas.forEach((tarefa) => {
                  const tarefaProcessada = {
                    ...tarefa,
                    projetoNome: projeto.nome,
                    projetoId: projeto.id,
                    status,
                  };
                  devData.tarefas.push(tarefaProcessada);

                  // Atualiza estatísticas
                  devData.stats.total++;

                  if (["aDefinir", "todo"].includes(status)) {
                    devData.stats.todo++;
                  } else if (
                    ["inProgress", "testing", "prontoDeploy"].includes(status)
                  ) {
                    devData.stats.doing++;
                  } else if (["done", "arquivado"].includes(status)) {
                    devData.stats.done++;
                  }

                  if (
                    tarefa.dataConclusao &&
                    new Date(tarefa.dataConclusao) < new Date()
                  ) {
                    devData.stats.vencidas++;
                  }
                });
              };

              // Processa cada coluna do kanban
              processarColuna(kanban.aDefinir, "aDefinir");
              processarColuna(kanban.todo, "todo");
              processarColuna(kanban.inProgress, "inProgress");
              processarColuna(kanban.testing, "testing");
              processarColuna(kanban.prontoDeploy, "prontoDeploy");
              processarColuna(kanban.done, "done");
              processarColuna(kanban.arquivado, "arquivado");
            }
          }
        }
      });

      // Converte o Map em array e filtra apenas desenvolvedores ativos
      const desenvolvedoresArray = Array.from(
        desenvolvedoresMap.values()
      ).filter((dev) => dev.status === "Ativo");

      setDesenvolvedores(desenvolvedoresArray);

      console.log(
        "Dados dos desenvolvedores carregados:",
        desenvolvedoresArray
      );
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
    setExpandedCard(expandedCard === "projects" ? null : "projects");
    if (expandedCard !== "projects") {
      setShowProjects(true);
      setShowAllProjects(false);
      setShowAnalistas(false);
      setShowDesenvolvedores(false);
      setTimeout(() => {
        document.querySelector('.projetos-relacionados')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setShowProjects(false);
    }
  };

  const handleEventosClick = () => {
    navigate("/escalas");
  };

  const handleProjetosCardClick = () => {
    setExpandedCard(expandedCard === "allProjects" ? null : "allProjects");
    if (expandedCard !== "allProjects") {
      setShowAllProjects(true);
      setShowProjects(false);
      setShowAnalistas(false);
      setShowDesenvolvedores(false);
      setTimeout(() => {
        document.querySelector('.projetos-relacionados')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setShowAllProjects(false);
    }
  };

  const handleAnalistasClick = () => {
    setExpandedCard(expandedCard === "analistas" ? null : "analistas");
    if (expandedCard !== "analistas") {
      setShowAnalistas(true);
      setShowProjects(false);
      setShowAllProjects(false);
      setShowDesenvolvedores(false);
      setTimeout(() => {
        document.querySelector('.projetos-relacionados')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setShowAnalistas(false);
    }
  };

  const handleDesenvolvedoresClick = () => {
    setExpandedCard(expandedCard === "desenvolvedores" ? null : "desenvolvedores");
    if (expandedCard !== "desenvolvedores") {
      setShowDesenvolvedores(true);
      setShowProjects(false);
      setShowAllProjects(false);
      setShowAnalistas(false);
      setTimeout(() => {
        document.querySelector('.projetos-relacionados')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setShowDesenvolvedores(false);
    }
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
      [task.id]: task.log || [],
    });
    setIsViewModalOpen(true);
  };

  const getLogMessage = (log) => {
    switch (log.tipo) {
      case "criacao":
        return "Tarefa criada";
      case "edicao":
        return "Tarefa editada";
      case "movimentacao":
        const [origem, destino] = log.detalhes
          .split("Movida de")[1]
          .split("para")
          .map((s) => s.trim());
        return `Movida de ${getStatusDisplay(origem)} para ${getStatusDisplay(
          destino
        )}`;
      case "comentario":
        return log.detalhes;
      default:
        return log.detalhes;
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "aDefinir":
        return "A Definir";
      case "todo":
        return "A Fazer";
      case "inProgress":
        return "Em Andamento";
      case "testing":
        return "Em Teste";
      case "prontoDeploy":
        return "Pronto para Deploy";
      case "done":
        return "Concluído";
      case "arquivado":
        return "Arquivado";
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
        detalhes: comentario.trim(),
      };

      // Encontra o projeto que contém a tarefa
      const projetoContendoTarefa = allProjetos.find((projeto) => {
        return Object.values(projeto.kanban).some((coluna) =>
          coluna.some((task) => task.id === selectedTask.id)
        );
      });
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      alert("Erro ao adicionar comentário. Por favor, tente novamente.");
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

      <div className="task-metadata">
        {tarefa.prioridade && (
          <span className={`task-priority priority-${tarefa.prioridade}`}>
            {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
          </span>
        )}

        {tarefa.tags && tarefa.tags.length > 0 && (
          <div className="task-tags-list">
            {tarefa.tags.map((tag) => (
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

        {tarefa.comentarios?.length > 0 && (
          <div className="task-chat-icon">
            <FontAwesomeIcon
              icon={faComments}
              className={`chat-icon ${tarefa.comentariosNaoLidos ? "has-unread" : ""}`}
            />
            {tarefa.comentariosNaoLidos && <div className="unread-indicator" />}
          </div>
        )}
      </div>

      <div className="task-content">{tarefa.content}</div>

      {tarefa.testes && tarefa.testes.length > 0 && (
        <div className="task-topicos-progresso">
          <div className="progresso-info">
            <span>Tópicos</span>
            <span>{Math.round((tarefa.testes.filter(teste => teste.concluido).length / tarefa.testes.length) * 100)}%</span>
          </div>
          <div className="progresso-barra-container">
            <div 
              className="progresso-barra"
              style={{ 
                width: `${Math.round(
                  (tarefa.testes.filter(teste => teste.concluido).length / 
                  tarefa.testes.length) * 100
                )}%` 
              }}
            />
          </div>
        </div>
      )}

      <div className="task-footer">
        <div className="task-assignee">
          {Array.isArray(tarefa.responsavel)
            ? tarefa.responsavel.map((r) => r.label || r).join(", ")
            : tarefa.responsavel?.label ||
              tarefa.responsavel ||
              "Não atribuído"}
        </div>

        <div className="task-dates">
          {tarefa.dataConclusao && (
            <div
              className={`task-date ${
                new Date(tarefa.dataConclusao) < new Date() ? "vencida" : ""
              }`}
            >
              <span className="date-label">Conclusão:</span>
              <span>
                {format(new Date(tarefa.dataConclusao), "dd/MM/yyyy")}
              </span>
            </div>
          )}
        </div>
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

    const isExpanded = expandedProjects.has(projeto.id);
    const stats = calcularEstatisticasProjeto(projeto);

    return (
      <div 
        key={projeto.id} 
        className={`projeto-card ${isExpanded ? 'expanded' : ''}`}
        onClick={() => handleProjectCardClick(projeto.id)}
      >
        {/* Informações básicas sempre visíveis */}
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

        {/* Resumo das tarefas sempre visível */}
        <div className="task-summary">
          <div className="task-count">
            <span>Total de Tarefas: {stats.totalTarefas}</span>
            {stats.tarefasVencidas > 0 && (
              <span className="warning">Vencidas: {stats.tarefasVencidas}</span>
            )}
          </div>
        </div>

        {/* Conteúdo expandido */}
        {isExpanded && (
          <>
            <div className="kanban-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalTarefas}</div>
                  <div className="stat-label">Total de Tarefas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.todo}</div>
                  <div className="stat-label">A Fazer</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.doing}</div>
                  <div className="stat-label">Em Andamento</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.done}</div>
                  <div className="stat-label">Concluídas</div>
                </div>
                <div className="stat-item warning">
                  <div className="stat-value">{stats.tarefasVencidas}</div>
                  <div className="stat-label">Vencidas</div>
                </div>
              </div>

              <div className="progress-bars">
                <div className="progress-item">
                  <div className="progress-header">
                    <span>A Fazer</span>
                    <span>{stats.todoPercent.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill todo"
                      style={{ width: `${stats.todoPercent}%` }}
                    />
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span>Em Andamento</span>
                    <span>{stats.doingPercent.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill doing"
                      style={{ width: `${stats.doingPercent}%` }}
                    />
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span>Concluídas</span>
                    <span>{stats.donePercent.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill done"
                      style={{ width: `${stats.donePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lista de tarefas recentes */}
              <div className="projeto-tarefas">
                <h6>Tarefas Recentes</h6>
                <div className="tarefas-list">
                  {projeto.kanban && Object.values(projeto.kanban)
                    .flat()
                    .slice(0, 3)
                    .map(tarefa => renderTarefaCard(tarefa))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const calcularEstatisticasProjeto = (projeto) => {
    const stats = {
      totalTarefas: 0,
      todo: 0,
      doing: 0,
      done: 0,
      tarefasVencidas: 0
    };

    if (projeto.kanban) {
      // Contagem de tarefas por status
      if (Array.isArray(projeto.kanban.aDefinir)) {
        stats.todo += projeto.kanban.aDefinir.length;
      }
      if (Array.isArray(projeto.kanban.todo)) {
        stats.todo += projeto.kanban.todo.length;
      }
      if (Array.isArray(projeto.kanban.inProgress)) {
        stats.doing += projeto.kanban.inProgress.length;
      }
      if (Array.isArray(projeto.kanban.testing)) {
        stats.doing += projeto.kanban.testing.length;
      }
      if (Array.isArray(projeto.kanban.prontoDeploy)) {
        stats.doing += projeto.kanban.prontoDeploy.length;
      }
      if (Array.isArray(projeto.kanban.done)) {
        stats.done += projeto.kanban.done.length;
      }
      if (Array.isArray(projeto.kanban.arquivado)) {
        stats.done += projeto.kanban.arquivado.length;
      }

      // Calcula o total de tarefas
      stats.totalTarefas = stats.todo + stats.doing + stats.done;

      // Conta tarefas vencidas
      Object.values(projeto.kanban).forEach(coluna => {
        if (Array.isArray(coluna)) {
          coluna.forEach(tarefa => {
            if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
              stats.tarefasVencidas++;
            }
          });
        }
      });
    }

    // Calcula as porcentagens
    stats.todoPercent = stats.totalTarefas > 0 ? (stats.todo / stats.totalTarefas) * 100 : 0;
    stats.doingPercent = stats.totalTarefas > 0 ? (stats.doing / stats.totalTarefas) * 100 : 0;
    stats.donePercent = stats.totalTarefas > 0 ? (stats.done / stats.totalTarefas) * 100 : 0;

    return stats;
  };

  const renderAnalistaCard = (analista) => {
    const stats = analista.stats;
    const isExpanded = expandedAnalistas.has(analista.id);
    
    // Calcula as porcentagens evitando divisão por zero
    const todoPercent = stats.total > 0 ? ((stats.todo / stats.total) * 100).toFixed(1) : 0;
    const doingPercent = stats.total > 0 ? ((stats.doing / stats.total) * 100).toFixed(1) : 0;
    const donePercent = stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(1) : 0;

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
      <div 
        key={analista.id} 
        className={`projeto-card ${isExpanded ? 'expanded' : ''}`}
        onClick={() => handleAnalistaCardClick(analista.id)}
      >
        {/* Informações básicas sempre visíveis */}
        <h5>{analista.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">Analista</span>
          <span className="status">{analista.projetos.length} projetos</span>
        </div>

        {/* Resumo das tarefas sempre visível */}
        <div className="task-summary">
          <div className="task-count">
            <span>Total de Tarefas: {stats.total}</span>
            {stats.vencidas > 0 && (
              <span className="warning">Vencidas: {stats.vencidas}</span>
            )}
          </div>
        </div>

        {/* Conteúdo expandido */}
        {isExpanded && (
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
                  <span>A Fazer</span>
                  <span>{todoPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill todo"
                    style={{ width: `${todoPercent}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span>Em Andamento</span>
                  <span>{doingPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill doing"
                    style={{ width: `${doingPercent}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span>Concluídas</span>
                  <span>{donePercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill done"
                    style={{ width: `${donePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de tarefas recentes */}
            <div className="projeto-tarefas">
              <h6>Tarefas Recentes</h6>
              <div className="tarefas-list">
                {tarefasOrdenadas.slice(0, 3).map(tarefa => renderTarefaCard(tarefa))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDesenvolvedorCard = (desenvolvedor) => {
    const stats = desenvolvedor.stats;
    const isExpanded = expandedDesenvolvedores.has(desenvolvedor.id);
    
    // Calcula as porcentagens evitando divisão por zero
    const todoPercent = stats.total > 0 ? ((stats.todo / stats.total) * 100).toFixed(1) : 0;
    const doingPercent = stats.total > 0 ? ((stats.doing / stats.total) * 100).toFixed(1) : 0;
    const donePercent = stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(1) : 0;

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
      <div 
        key={desenvolvedor.id} 
        className={`projeto-card ${isExpanded ? 'expanded' : ''}`}
        onClick={() => handleDesenvolvedorCardClick(desenvolvedor.id)}
      >
        {/* Informações básicas sempre visíveis */}
        <h5>{desenvolvedor.nome}</h5>
        <div className="projeto-info">
          <span className="tipo">Desenvolvedor</span>
          <span className="status">{desenvolvedor.projetos.length} projetos</span>
        </div>

        {/* Resumo das tarefas sempre visível */}
        <div className="task-summary">
          <div className="task-count">
            <span>Total de Tarefas: {stats.total}</span>
            {stats.vencidas > 0 && (
              <span className="warning">Vencidas: {stats.vencidas}</span>
            )}
          </div>
        </div>

        {/* Conteúdo expandido */}
        {isExpanded && (
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
                  <span>A Fazer</span>
                  <span>{todoPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill todo"
                    style={{ width: `${todoPercent}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span>Em Andamento</span>
                  <span>{doingPercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill doing"
                    style={{ width: `${doingPercent}%` }}
                  />
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span>Concluídas</span>
                  <span>{donePercent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill done"
                    style={{ width: `${donePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de tarefas recentes */}
            <div className="projeto-tarefas">
              <h6>Tarefas Recentes</h6>
              <div className="tarefas-list">
                {tarefasOrdenadas.slice(0, 3).map(tarefa => renderTarefaCard(tarefa))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalistasSection = () => {
    const analistasParaMostrar = analistaFiltrado
      ? analistas.filter((analista) => analista.nome === analistaFiltrado)
      : analistas;

    return (
      <div className="projetos-relacionados">
        <div className="projetos-section">
          <h3>
            <FontAwesomeIcon icon={faUsers} />
            {analistaFiltrado
              ? `Visão do Analista: ${analistaFiltrado}`
              : "Visão por Analista"}
          </h3>
          {renderAnalistaGraficos(analistasParaMostrar)}
          <div className="projetos-grid">
            {analistasParaMostrar.length > 0 
              ? analistasParaMostrar.map((analista) => renderAnalistaCard(analista))
              : <p className="no-projects">Nenhum analista encontrado</p>
            }
          </div>
        </div>
      </div>
    );
  };

  const renderDesenvolvedoresSection = () => {
    const devsParaMostrar = desenvolvedorFiltrado
      ? desenvolvedores.filter((dev) => dev.nome === desenvolvedorFiltrado)
      : desenvolvedores;

    return (
      <div className="projetos-relacionados">
        <div className="projetos-section">
          <h3>
            <FontAwesomeIcon icon={faUsers} />
            {desenvolvedorFiltrado
              ? `Visão do Desenvolvedor: ${desenvolvedorFiltrado}`
              : "Visão por Desenvolvedor"}
          </h3>
          {renderDesenvolvedorGraficos(devsParaMostrar)}
          <div className="projetos-grid">
            {devsParaMostrar.length > 0 
              ? devsParaMostrar.map((dev) => renderDesenvolvedorCard(dev))
              : <p className="no-projects">Nenhum desenvolvedor encontrado</p>
            }
          </div>
        </div>
      </div>
    );
  };

  const renderKanbanGeral = () => {
    const colunas = {
      aDefinir: {
        titulo: "A Definir",
        cor: "#6366f1",
        icon: faSpinner,
      },
      todo: {
        titulo: "A Fazer",
        cor: "#8b5cf6",
        icon: faTasks,
      },
      inProgress: {
        titulo: "Em Andamento",
        cor: "#2196f3",
        icon: faSpinner,
      },
      testing: {
        titulo: "Em Teste",
        cor: "#f59e0b",
        icon: faCheckCircle,
      },
      prontoDeploy: {
        titulo: "Pronto para Deploy",
        cor: "#10b981",
        icon: faCheckCircle,
      },
      done: {
        titulo: "Concluído",
        cor: "#4caf50",
        icon: faCheckCircle,
      },
      arquivado: {
        titulo: "Arquivado",
        cor: "#6b7280",
        icon: faArchive,
      },
    };

    const projetosPorColuna = {};

    // Inicializa as colunas
    Object.keys(colunas).forEach((coluna) => {
      projetosPorColuna[coluna] = [];
    });

    // Organiza os projetos por coluna
    allProjetos.forEach((projeto) => {
      Object.entries(colunas).forEach(([key, _]) => {
        if (projeto.kanban?.[key]?.length > 0) {
          projetosPorColuna[key].push({
            ...projeto,
            tarefas: projeto.kanban[key],
          });
        }
      });
    });

    return (
      <div className="kanban-board">
        {Object.entries(colunas).map(([key, coluna]) => {
          const projetosDaColuna = projetosPorColuna[key];

          return (
            <div
              key={key}
              className="kanban-coluna-container"
              data-coluna={key}
            >
              <div className="kanban-coluna-header">
                <h4>
                  <FontAwesomeIcon
                    icon={coluna.icon}
                    className={`column-icon ${
                      key === "inProgress" ? "spin" : ""
                    }`}
                  />
                  {coluna.titulo}
                </h4>
                <span className="coluna-contador">
                  {projetosDaColuna.reduce(
                    (total, p) => total + p.tarefas.length,
                    0
                  )}{" "}
                  tarefas
                </span>
              </div>
              <div className="kanban-coluna-content">
                {projetosDaColuna.length > 0 ? (
                  projetosDaColuna.map((projeto) => (
                    <div
                      key={`${key}-${projeto.id}`}
                      className="projeto-card-kanban"
                    >
                      <div className="projeto-card-header">
                        <h5>{projeto.nome}</h5>
                        <span className="tipo-badge">
                          {projeto.tipo || "Não definido"}
                        </span>
                      </div>
                      <div className="tarefas-list">
                        {projeto.tarefas.map((tarefa) =>
                          renderTarefaCard(tarefa)
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-tasks">
                    <p>Nenhuma tarefa nesta coluna</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderKanbanGraficos = () => {
    // Função para calcular o total de tarefas de todos os projetos
    const calcularTotalTarefas = () => {
      let total = 0;
      allProjetos.forEach((projeto) => {
        Object.values(projeto.kanban || {}).forEach((coluna) => {
          if (Array.isArray(coluna)) {
            total += coluna.length;
          }
        });
      });
      return total;
    };

    // Calcule o total de tarefas usando a nova função
    const totalTarefas = calcularTotalTarefas();

    // Calcule o total de tarefas vencidas
    const calcularTarefasVencidas = () => {
      let vencidas = 0;
      let proximasVencer = 0;
      const hoje = new Date();
      const emUmaSemana = new Date();
      emUmaSemana.setDate(hoje.getDate() + 7);

      allProjetos.forEach((projeto) => {
        Object.values(projeto.kanban || {}).forEach((coluna) => {
          if (Array.isArray(coluna)) {
            coluna.forEach((tarefa) => {
              if (tarefa.dataConclusao) {
                const dataLimite = new Date(tarefa.dataConclusao);
                if (dataLimite < hoje) {
                  vencidas++;
                } else if (dataLimite <= emUmaSemana) {
                  proximasVencer++;
                }
              }
            });
          }
        });
      });

      return { vencidas, proximasVencer };
    };

    // Função para calcular distribuição por prioridade
    const calcularDistribuicaoPrioridade = () => {
      const distribuicao = {
        alta: 0,
        media: 0,
        baixa: 0,
        indefinida: 0,
      };

      allProjetos.forEach((projeto) => {
        Object.values(projeto.kanban || {}).forEach((coluna) => {
          if (Array.isArray(coluna)) {
            coluna.forEach((tarefa) => {
              const prioridade =
                tarefa.prioridade?.toLowerCase() || "indefinida";
              distribuicao[prioridade]++;
            });
          }
        });
      });

      return distribuicao;
    };

    // Função para calcular distribuição por responsável
    const calcularDistribuicaoPorResponsavel = () => {
      const distribuicao = {};

      allProjetos.forEach((projeto) => {
        Object.values(projeto.kanban || {}).forEach((coluna) => {
          if (Array.isArray(coluna)) {
            coluna.forEach((tarefa) => {
              if (Array.isArray(tarefa.responsavel)) {
                tarefa.responsavel.forEach((resp) => {
                  const nome = resp.label || resp;
                  distribuicao[nome] = (distribuicao[nome] || 0) + 1;
                });
              } else if (tarefa.responsavel) {
                const nome = tarefa.responsavel.label || tarefa.responsavel;
                distribuicao[nome] = (distribuicao[nome] || 0) + 1;
              }
            });
          }
        });
      });

      // Pega os 5 responsáveis com mais tarefas
      return Object.entries(distribuicao)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    };

    // Calcule as estatísticas
    const { vencidas, proximasVencer } = calcularTarefasVencidas();
    const distribuicaoPrioridade = calcularDistribuicaoPrioridade();
    const distribuicaoResponsavel = calcularDistribuicaoPorResponsavel();

    // Atualize os dados dos gráficos
    const trendData = {
      labels: [
        "Backlog",
        "Em Progresso",
        "Concluídas",
        "Vencidas",
        "Próximas a Vencer",
      ],
      datasets: [
        {
          label: "Tarefas",
          data: [
            indicadores.aDefinir + indicadores.todo,
            indicadores.inProgress +
              indicadores.testing +
              indicadores.prontoDeploy,
            indicadores.done,
            vencidas,
            proximasVencer,
          ],
          backgroundColor: [
            "rgba(99, 102, 241, 0.2)",
            "rgba(33, 150, 243, 0.2)",
            "rgba(16, 185, 129, 0.2)",
            "rgba(239, 68, 68, 0.2)",
            "rgba(245, 158, 11, 0.2)",
          ],
          borderColor: ["#6366f1", "#2196f3", "#10b981", "#ef4444", "#f59e0b"],
          borderWidth: 2,
        },
      ],
    };

    // Gráfico de prioridades
    const prioridadesData = {
      labels: ["Alta", "Média", "Baixa", "Indefinida"],
      datasets: [
        {
          data: [
            distribuicaoPrioridade.alta,
            distribuicaoPrioridade.media,
            distribuicaoPrioridade.baixa,
            distribuicaoPrioridade.indefinida,
          ],
          backgroundColor: [
            "rgba(239, 68, 68, 0.2)",
            "rgba(245, 158, 11, 0.2)",
            "rgba(16, 185, 129, 0.2)",
            "rgba(107, 114, 128, 0.2)",
          ],
          borderColor: ["#ef4444", "#f59e0b", "#10b981", "#6b7280"],
          borderWidth: 2,
        },
      ],
    };

    // Gráfico de responsáveis
    const responsaveisData = {
      labels: Object.keys(distribuicaoResponsavel),
      datasets: [
        {
          label: "Tarefas por Responsável",
          data: Object.values(distribuicaoResponsavel),
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          borderColor: "#6366f1",
          borderWidth: 2,
        },
      ],
    };

    // Adicione esta função para calcular tarefas por projeto
    const calcularTarefasPorProjeto = () => {
      const tarefasPorProjeto = {};

      allProjetos.forEach(projeto => {
        const totalTarefas = Object.values(projeto.kanban || {}).reduce((total, coluna) => {
          return total + (Array.isArray(coluna) ? coluna.length : 0);
        }, 0);

        if (totalTarefas > 0) {
          tarefasPorProjeto[projeto.nome] = totalTarefas;
        }
      });

      // Ordena os projetos por quantidade de tarefas (decrescente)
      return Object.fromEntries(
        Object.entries(tarefasPorProjeto)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10) // Limita aos 10 projetos com mais tarefas
      );
    };

    const tarefasPorProjeto = calcularTarefasPorProjeto();

    // Adicione os dados para o novo gráfico
    const projetosComparativoData = {
      labels: Object.keys(tarefasPorProjeto),
      datasets: [{
        label: 'Quantidade de Tarefas',
        data: Object.values(tarefasPorProjeto),
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196f3',
        borderWidth: 2,
      }]
    };

    // Opções específicas para o gráfico de comparativo
    const comparativoOptions = {
      ...barOptions,
      indexAxis: 'y', // Para fazer barras horizontais
      plugins: {
        ...barOptions.plugins,
        title: {
          display: true,
          text: 'Top 10 Projetos por Quantidade de Tarefas',
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
          },
          ticks: {
            stepSize: 1,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        }
      }
    };

    return (
      <div className="kanban-graficos">
        <div className="graficos-header">
          <div className="metricas-resumo">
            <div className="metrica-item">
              <span className="metrica-valor">{totalTarefas}</span>
              <span className="metrica-label">Total de Tarefas</span>
            </div>
            <div className="metrica-item warning">
              <span className="metrica-valor">{vencidas}</span>
              <span className="metrica-label">Tarefas Vencidas</span>
            </div>
            <div className="metrica-item alert">
              <span className="metrica-valor">{proximasVencer}</span>
              <span className="metrica-label">Próximas ao Vencimento</span>
            </div>
            <div className="metrica-item success">
              <span className="metrica-valor">
                {totalTarefas
                  ? ((indicadores.done / totalTarefas) * 100).toFixed(1)
                  : 0}
                %
              </span>
              <span className="metrica-label">Taxa de Conclusão</span>
            </div>
          </div>
        </div>

        <div className="graficos-container">
          <div className="grafico-card">
            <h4>Status das Tarefas</h4>
            <div className="grafico-wrapper">
              <Bar data={trendData} options={barOptions} />
            </div>
            <div className="grafico-info">
              {vencidas > 0 && (
                <div className="alerta-vencimento">
                  Atenção: {vencidas} tarefas vencidas
                </div>
              )}
            </div>
          </div>

          <div className="grafico-card">
            <h4>Distribuição por Prioridade</h4>
            <div className="grafico-wrapper">
              <Pie data={prioridadesData} options={pieOptions} />
            </div>
            <div className="grafico-info">
              Prioridade mais comum:{" "}
              {Object.entries(distribuicaoPrioridade)
                .reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                .charAt(0)
                .toUpperCase() +
                Object.entries(distribuicaoPrioridade)
                  .reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                  .slice(1)}
            </div>
          </div>

          <div className="grafico-card">
            <h4>Top 5 Responsáveis</h4>
            <div className="grafico-wrapper">
              <Bar data={responsaveisData} options={barOptions} />
            </div>
            <div className="grafico-info">
              Total de responsáveis ativos:{" "}
              {Object.keys(distribuicaoResponsavel).length}
            </div>
          </div>

          <div className="grafico-card">
            <h4>Evolução do Fluxo</h4>
            <div className="grafico-wrapper">
              <Line data={lineData} options={lineOptions} />
            </div>
            <div className="grafico-info">
              Taxa de progresso:{" "}
              {totalTarefas
                ? (
                    ((indicadores.inProgress +
                      indicadores.testing +
                      indicadores.prontoDeploy) /
                      totalTarefas) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </div>

          <div className="grafico-card">
            <h4>Comparativo de Tarefas por Projeto</h4>
            <div className="grafico-wrapper">
              <Bar data={projetosComparativoData} options={comparativoOptions} />
            </div>
            <div className="grafico-info">
              Total de projetos com tarefas: {Object.keys(tarefasPorProjeto).length}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalistaGraficos = (analistasData) => {
    // Função para calcular estatísticas agregadas dos analistas selecionados
    const calcularEstatisticasAnalistas = () => {
      const stats = {
        totalTarefas: 0,
        tarefasVencidas: 0,
        proximasVencer: 0,
        distribuicaoPrioridade: {
          alta: 0,
          media: 0,
          baixa: 0,
          indefinida: 0
        },
        distribuicaoStatus: {
          aDefinir: 0,
          todo: 0,
          inProgress: 0,
          testing: 0,
          prontoDeploy: 0,
          done: 0,
          arquivado: 0
        },
        progressoMensal: {
          concluidas: 0,
          emAndamento: 0,
          pendentes: 0
        }
      };

      const hoje = new Date();
      const emUmaSemana = new Date();
      emUmaSemana.setDate(hoje.getDate() + 7);

      analistasData.forEach(analista => {
        // Contagem total de tarefas
        stats.totalTarefas += analista.stats.total;

        // Análise detalhada das tarefas
        analista.tarefas.forEach(tarefa => {
          // Contagem por prioridade
          const prioridade = tarefa.prioridade?.toLowerCase() || 'indefinida';
          stats.distribuicaoPrioridade[prioridade]++;

          // Contagem por status
          stats.distribuicaoStatus[tarefa.status]++;

          // Verificação de prazos
          if (tarefa.dataConclusao) {
            const dataLimite = new Date(tarefa.dataConclusao);
            if (dataLimite < hoje) {
              stats.tarefasVencidas++;
            } else if (dataLimite <= emUmaSemana) {
              stats.proximasVencer++;
            }
          }

          // Análise de progresso mensal
          if (['done', 'arquivado'].includes(tarefa.status)) {
            stats.progressoMensal.concluidas++;
          } else if (['inProgress', 'testing', 'prontoDeploy'].includes(tarefa.status)) {
            stats.progressoMensal.emAndamento++;
          } else {
            stats.progressoMensal.pendentes++;
          }
        });
      });

      return stats;
    };

    const stats = calcularEstatisticasAnalistas();

    // Função para calcular tarefas por projeto
    const calcularTarefasPorProjeto = (analistas) => {
      const tarefasPorProjeto = {};
      
      analistas.forEach(analista => {
        analista.projetos.forEach(projeto => {
          const totalTarefas = Object.values(projeto.kanban || {}).reduce((total, coluna) => {
            return total + (Array.isArray(coluna) ? coluna.length : 0);
          }, 0);

          if (totalTarefas > 0) {
            if (tarefasPorProjeto[projeto.nome]) {
              tarefasPorProjeto[projeto.nome] += totalTarefas;
            } else {
              tarefasPorProjeto[projeto.nome] = totalTarefas;
            }
          }
        });
      });

      return Object.fromEntries(
        Object.entries(tarefasPorProjeto)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      );
    };

    // Dados para os gráficos
    const statusData = {
      labels: [
        'A Definir',
        'A Fazer',
        'Em Andamento',
        'Em Teste',
        'Pronto Deploy',
        'Concluído',
        'Arquivado'
      ],
      datasets: [{
        label: 'Tarefas por Status',
        data: [
          stats.distribuicaoStatus.aDefinir,
          stats.distribuicaoStatus.todo,
          stats.distribuicaoStatus.inProgress,
          stats.distribuicaoStatus.testing,
          stats.distribuicaoStatus.prontoDeploy,
          stats.distribuicaoStatus.done,
          stats.distribuicaoStatus.arquivado
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.2)',
          'rgba(139, 92, 246, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(16, 185, 129, 0.2)',
          'rgba(76, 175, 80, 0.2)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderColor: [
          '#6366f1',
          '#8b5cf6',
          '#2196f3',
          '#f59e0b',
          '#10b981',
          '#4caf50',
          '#6b7280'
        ],
        borderWidth: 2
      }]
    };

    const prioridadesData = {
      labels: ['Alta', 'Média', 'Baixa', 'Indefinida'],
      datasets: [{
        data: [
          stats.distribuicaoPrioridade.alta,
          stats.distribuicaoPrioridade.media,
          stats.distribuicaoPrioridade.baixa,
          stats.distribuicaoPrioridade.indefinida
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(16, 185, 129, 0.2)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#6b7280'
        ],
        borderWidth: 2
      }]
    };

    const projetosData = {
      labels: Object.keys(calcularTarefasPorProjeto(analistasData)),
      datasets: [{
        label: 'Quantidade de Tarefas',
        data: Object.values(calcularTarefasPorProjeto(analistasData)),
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196f3',
        borderWidth: 2,
      }]
    };

    const comparativoOptions = {
      ...barOptions,
      indexAxis: 'y',
      plugins: {
        ...barOptions.plugins,
        title: {
          display: true,
          text: 'Top 5 Projetos por Quantidade de Tarefas',
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
          },
          ticks: {
            stepSize: 1,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        }
      }
    };

    const progressoData = {
      labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
      datasets: [{
        label: 'Progresso das Tarefas',
        data: [
          stats.progressoMensal.pendentes,
          stats.progressoMensal.emAndamento,
          stats.progressoMensal.concluidas
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(16, 185, 129, 0.2)'
        ],
        borderColor: [
          '#ef4444',
          '#2196f3',
          '#10b981'
        ],
        borderWidth: 2
      }]
    };

    return (
      <div className="kanban-graficos">
        <div className="graficos-header">
          <div className="metricas-resumo">
            <div className="metrica-item">
              <span className="metrica-valor">{stats.totalTarefas}</span>
              <span className="metrica-label">Total de Tarefas</span>
            </div>
            <div className="metrica-item warning">
              <span className="metrica-valor">{stats.tarefasVencidas}</span>
              <span className="metrica-label">Tarefas Vencidas</span>
            </div>
            <div className="metrica-item alert">
              <span className="metrica-valor">{stats.proximasVencer}</span>
              <span className="metrica-label">Próximas ao Vencimento</span>
            </div>
            <div className="metrica-item success">
              <span className="metrica-valor">
                {stats.totalTarefas 
                  ? ((stats.progressoMensal.concluidas / stats.totalTarefas) * 100).toFixed(1) 
                  : 0}%
              </span>
              <span className="metrica-label">Taxa de Conclusão</span>
            </div>
          </div>
        </div>

        <div className="graficos-container">
          <div className="grafico-card">
            <h4>Distribuição por Status</h4>
            <div className="grafico-wrapper">
              <Bar data={statusData} options={barOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Distribuição por Prioridade</h4>
            <div className="grafico-wrapper">
              <Pie data={prioridadesData} options={pieOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Progresso Mensal</h4>
            <div className="grafico-wrapper">
              <Bar data={progressoData} options={barOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Comparativo de Tarefas por Projeto</h4>
            <div className="grafico-wrapper">
              <Bar data={projetosData} options={comparativoOptions} />
            </div>
            <div className="grafico-info">
              Total de projetos ativos: {analistasData.reduce((total, analista) => 
                total + analista.projetos.length, 0
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDesenvolvedorGraficos = (desenvolvedoresData) => {
    // Função para calcular estatísticas agregadas dos desenvolvedores selecionados
    const calcularEstatisticasDesenvolvedores = () => {
      const stats = {
        totalTarefas: 0,
        tarefasVencidas: 0,
        proximasVencer: 0,
        distribuicaoPrioridade: {
          alta: 0,
          media: 0,
          baixa: 0,
          indefinida: 0
        },
        distribuicaoStatus: {
          aDefinir: 0,
          todo: 0,
          inProgress: 0,
          testing: 0,
          prontoDeploy: 0,
          done: 0,
          arquivado: 0
        },
        progressoMensal: {
          concluidas: 0,
          emAndamento: 0,
          pendentes: 0
        }
      };

      const hoje = new Date();
      const emUmaSemana = new Date();
      emUmaSemana.setDate(hoje.getDate() + 7);

      desenvolvedoresData.forEach(desenvolvedor => {
        // Contagem total de tarefas
        stats.totalTarefas += desenvolvedor.stats.total;

        // Análise detalhada das tarefas
        desenvolvedor.tarefas.forEach(tarefa => {
          // Contagem por prioridade
          const prioridade = tarefa.prioridade?.toLowerCase() || 'indefinida';
          stats.distribuicaoPrioridade[prioridade]++;

          // Contagem por status
          stats.distribuicaoStatus[tarefa.status]++;

          // Verificação de prazos
          if (tarefa.dataConclusao) {
            const dataLimite = new Date(tarefa.dataConclusao);
            if (dataLimite < hoje) {
              stats.tarefasVencidas++;
            } else if (dataLimite <= emUmaSemana) {
              stats.proximasVencer++;
            }
          }

          // Análise de progresso mensal
          if (['done', 'arquivado'].includes(tarefa.status)) {
            stats.progressoMensal.concluidas++;
          } else if (['inProgress', 'testing', 'prontoDeploy'].includes(tarefa.status)) {
            stats.progressoMensal.emAndamento++;
          } else {
            stats.progressoMensal.pendentes++;
          }
        });
      });

      return stats;
    };

    const stats = calcularEstatisticasDesenvolvedores();

    // Dados para o gráfico de distribuição de status
    const statusData = {
      labels: [
        'A Definir',
        'A Fazer',
        'Em Andamento',
        'Em Teste',
        'Pronto Deploy',
        'Concluído',
        'Arquivado'
      ],
      datasets: [{
        label: 'Tarefas por Status',
        data: [
          stats.distribuicaoStatus.aDefinir,
          stats.distribuicaoStatus.todo,
          stats.distribuicaoStatus.inProgress,
          stats.distribuicaoStatus.testing,
          stats.distribuicaoStatus.prontoDeploy,
          stats.distribuicaoStatus.done,
          stats.distribuicaoStatus.arquivado
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.2)',
          'rgba(139, 92, 246, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(16, 185, 129, 0.2)',
          'rgba(76, 175, 80, 0.2)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderColor: [
          '#6366f1',
          '#8b5cf6',
          '#2196f3',
          '#f59e0b',
          '#10b981',
          '#4caf50',
          '#6b7280'
        ],
        borderWidth: 2
      }]
    };

    // Dados para o gráfico de prioridades
    const prioridadesData = {
      labels: ['Alta', 'Média', 'Baixa', 'Indefinida'],
      datasets: [{
        data: [
          stats.distribuicaoPrioridade.alta,
          stats.distribuicaoPrioridade.media,
          stats.distribuicaoPrioridade.baixa,
          stats.distribuicaoPrioridade.indefinida
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(16, 185, 129, 0.2)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#6b7280'
        ],
        borderWidth: 2
      }]
    };

    // Dados para o gráfico de progresso mensal
    const progressoData = {
      labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
      datasets: [{
        label: 'Progresso das Tarefas',
        data: [
          stats.progressoMensal.pendentes,
          stats.progressoMensal.emAndamento,
          stats.progressoMensal.concluidas
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(16, 185, 129, 0.2)'
        ],
        borderColor: [
          '#ef4444',
          '#2196f3',
          '#10b981'
        ],
        borderWidth: 2
      }]
    };

    // Dentro da função renderDesenvolvedorGraficos, adicione após o progressoData:

    // Função para calcular tarefas por projeto do desenvolvedor
    const calcularTarefasPorProjeto = (desenvolvedores) => {
      const tarefasPorProjeto = {};
      
      desenvolvedores.forEach(desenvolvedor => {
        desenvolvedor.projetos.forEach(projeto => {
          const totalTarefas = Object.values(projeto.kanban || {}).reduce((total, coluna) => {
            return total + (Array.isArray(coluna) ? coluna.length : 0);
          }, 0);

          if (totalTarefas > 0) {
            if (tarefasPorProjeto[projeto.nome]) {
              tarefasPorProjeto[projeto.nome] += totalTarefas;
            } else {
              tarefasPorProjeto[projeto.nome] = totalTarefas;
            }
          }
        });
      });

      return Object.fromEntries(
        Object.entries(tarefasPorProjeto)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      );
    };

    // Dados para o gráfico de projetos
    const projetosData = {
      labels: Object.keys(calcularTarefasPorProjeto(desenvolvedoresData)),
      datasets: [{
        label: 'Quantidade de Tarefas',
        data: Object.values(calcularTarefasPorProjeto(desenvolvedoresData)),
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196f3',
        borderWidth: 2,
      }]
    };

    // Opções específicas para o gráfico de comparativo
    const comparativoOptions = {
      ...barOptions,
      indexAxis: 'y',
      plugins: {
        ...barOptions.plugins,
        title: {
          display: true,
          text: 'Top 5 Projetos por Quantidade de Tarefas',
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
          },
          ticks: {
            stepSize: 1,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            }
          }
        }
      }
    };

    return (
      <div className="kanban-graficos">
        <div className="graficos-header">
          <div className="metricas-resumo">
            <div className="metrica-item">
              <span className="metrica-valor">{stats.totalTarefas}</span>
              <span className="metrica-label">Total de Tarefas</span>
            </div>
            <div className="metrica-item warning">
              <span className="metrica-valor">{stats.tarefasVencidas}</span>
              <span className="metrica-label">Tarefas Vencidas</span>
            </div>
            <div className="metrica-item alert">
              <span className="metrica-valor">{stats.proximasVencer}</span>
              <span className="metrica-label">Próximas ao Vencimento</span>
            </div>
            <div className="metrica-item success">
              <span className="metrica-valor">
                {stats.totalTarefas 
                  ? ((stats.progressoMensal.concluidas / stats.totalTarefas) * 100).toFixed(1) 
                  : 0}%
              </span>
              <span className="metrica-label">Taxa de Conclusão</span>
            </div>
          </div>
        </div>

        <div className="graficos-container">
          <div className="grafico-card">
            <h4>Distribuição por Status</h4>
            <div className="grafico-wrapper">
              <Bar data={statusData} options={barOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Distribuição por Prioridade</h4>
            <div className="grafico-wrapper">
              <Pie data={prioridadesData} options={pieOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Progresso Mensal</h4>
            <div className="grafico-wrapper">
              <Bar data={progressoData} options={barOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Comparativo de Tarefas por Projeto</h4>
            <div className="grafico-wrapper">
              <Bar data={projetosData} options={comparativoOptions} />
            </div>
            <div className="grafico-info">
              Total de projetos ativos: {desenvolvedoresData.reduce((total, desenvolvedor) => 
                total + desenvolvedor.projetos.length, 0
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllProjectsSection = () => (
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
        {renderProjetosGraficos()}
        <div className="projetos-grid">
          {allProjetos.length > 0 ? (
            allProjetos.map((projeto) => renderProjetoSimples(projeto))
          ) : (
            <p className="no-projects">Nenhum projeto cadastrado</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjetosGraficos = () => {
    // Função para calcular estatísticas dos projetos
    const calcularEstatisticasProjetos = () => {
      const stats = {
        totalProjetos: allProjetos.length,
        projetosAtivos: 0,
        projetosConcluidos: 0,
        distribuicaoTipo: {},
        distribuicaoStatus: {},
        projetosPorTipo: {},
        projetosPorStatus: {},
        tarefasPorMes: {
          concluidas: 0,
          emAndamento: 0,
          pendentes: 0,
          vencidas: 0
        }
      };

      allProjetos.forEach(projeto => {
        // Contagem por tipo
        const tipo = projeto.tipo || "Não definido";
        stats.distribuicaoTipo[tipo] = (stats.distribuicaoTipo[tipo] || 0) + 1;
        
        if (!stats.projetosPorTipo[tipo]) {
          stats.projetosPorTipo[tipo] = [];
        }
        stats.projetosPorTipo[tipo].push(projeto.nome);

        // Contagem e armazenamento por status
        const status = projeto.status || "Em Andamento";
        stats.distribuicaoStatus[status] = (stats.distribuicaoStatus[status] || 0) + 1;
        
        if (!stats.projetosPorStatus[status]) {
          stats.projetosPorStatus[status] = [];
        }
        stats.projetosPorStatus[status].push(projeto.nome);

        // Verifica se o projeto está concluído
        if (status === "Concluído") {
          stats.projetosConcluidos++;
        } else {
          stats.projetosAtivos++;
        }

        // Análise das tarefas
        if (projeto.kanban) {
          Object.entries(projeto.kanban).forEach(([status, tarefas]) => {
            if (Array.isArray(tarefas)) {
              tarefas.forEach(tarefa => {
                if (['done', 'arquivado'].includes(status)) {
                  stats.tarefasPorMes.concluidas++;
                } else if (['inProgress', 'testing', 'prontoDeploy'].includes(status)) {
                  stats.tarefasPorMes.emAndamento++;
                } else {
                  stats.tarefasPorMes.pendentes++;
                }

                if (tarefa.dataConclusao && new Date(tarefa.dataConclusao) < new Date()) {
                  stats.tarefasPorMes.vencidas++;
                }
              });
            }
          });
        }
      });

      return stats;
    };

    const stats = calcularEstatisticasProjetos();

    // Dados para o gráfico de distribuição por tipo
    const tiposData = {
      labels: Object.keys(stats.distribuicaoTipo),
      datasets: [{
        label: 'Projetos por Tipo',
        data: Object.values(stats.distribuicaoTipo),
        backgroundColor: [
          'rgba(99, 102, 241, 0.2)',
          'rgba(139, 92, 246, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(16, 185, 129, 0.2)',
        ],
        borderColor: [
          '#6366f1',
          '#8b5cf6',
          '#2196f3',
          '#f59e0b',
          '#10b981',
        ],
        borderWidth: 2
      }]
    };

    // Dados para o gráfico de status
    const statusData = {
      labels: Object.keys(stats.distribuicaoStatus),
      datasets: [{
        label: 'Projetos por Status',
        data: Object.values(stats.distribuicaoStatus),
        backgroundColor: [
          'rgba(16, 185, 129, 0.2)',
          'rgba(245, 158, 11, 0.2)',
          'rgba(239, 68, 68, 0.2)',
          'rgba(107, 114, 128, 0.2)',
        ],
        borderColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#6b7280',
        ],
        borderWidth: 2
      }]
    };

    // Dados para o gráfico de tarefas
    const tarefasData = {
      labels: ['Pendentes', 'Em Andamento', 'Concluídas', 'Vencidas'],
      datasets: [{
        label: 'Distribuição de Tarefas',
        data: [
          stats.tarefasPorMes.pendentes,
          stats.tarefasPorMes.emAndamento,
          stats.tarefasPorMes.concluidas,
          stats.tarefasPorMes.vencidas
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.2)',
          'rgba(33, 150, 243, 0.2)',
          'rgba(16, 185, 129, 0.2)',
          'rgba(239, 68, 68, 0.2)',
        ],
        borderColor: [
          '#6366f1',
          '#2196f3',
          '#10b981',
          '#ef4444',
        ],
        borderWidth: 2
      }]
    };

    return (
      <div className="kanban-graficos">
        <div className="graficos-header">
          <div className="metricas-resumo">
            <div className="metrica-item">
              <span className="metrica-valor">{stats.totalProjetos}</span>
              <span className="metrica-label">Total de Projetos</span>
            </div>
            <div className="metrica-item success">
              <span className="metrica-valor">{stats.projetosAtivos}</span>
              <span className="metrica-label">Projetos Ativos</span>
            </div>
            <div className="metrica-item warning">
              <span className="metrica-valor">{stats.totalProjetos - stats.projetosAtivos}</span>
              <span className="metrica-label">Projetos Inativos</span>
            </div>
            <div className="metrica-item">
              <span className="metrica-valor">
                {stats.tarefasPorMes.pendentes + 
                 stats.tarefasPorMes.emAndamento + 
                 stats.tarefasPorMes.concluidas}
              </span>
              <span className="metrica-label">Total de Tarefas</span>
            </div>
          </div>
        </div>

        <div className="graficos-container">
          <div className="grafico-card">
            <h4>Distribuição por Tipo</h4>
            <div className="grafico-wrapper">
              <Pie data={tiposData} options={pieOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Status dos Projetos</h4>
            <div className="grafico-wrapper">
              <Bar data={statusData} options={barOptions} />
            </div>
          </div>

          <div className="grafico-card">
            <h4>Distribuição de Tarefas</h4>
            <div className="grafico-wrapper">
              <Bar data={tarefasData} options={tarefasOptions} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Adicione esta constante junto com as outras definições de opções no início do componente
  const tarefasOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        callbacks: {
          label: function(context) {
            const quantidade = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const porcentagem = ((quantidade / total) * 100).toFixed(1);
            
            return `Total: ${quantidade} tarefa${quantidade !== 1 ? 's' : ''} (${porcentagem}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#000',
        anchor: 'end',
        align: 'end',
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const porcentagem = ((value / total) * 100).toFixed(1);
          return `${porcentagem}%`;
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  };

  // Adicione esta função para gerenciar o clique no card do projeto
  const handleProjectCardClick = (projectId) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Adicione esta função junto com as outras funções auxiliares
  const getResponsavelNome = (responsavel) => {
    if (!responsavel) return "Não definido";
    
    // Se for um array de responsáveis
    if (Array.isArray(responsavel)) {
      return responsavel.map(r => r.label || r.nome || r).join(", ");
    }
    
    // Se for um objeto único
    if (typeof responsavel === 'object') {
      return responsavel.label || responsavel.nome || "Não definido";
    }
    
    // Se for uma string
    return responsavel;
  };

  // Adicione esta função para gerenciar o clique no card do analista
  const handleAnalistaCardClick = (analistaId) => {
    setExpandedAnalistas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analistaId)) {
        newSet.delete(analistaId);
      } else {
        newSet.add(analistaId);
      }
      return newSet;
    });
  };

  // Adicione esta função para gerenciar o clique no card do desenvolvedor
  const handleDesenvolvedorCardClick = (devId) => {
    setExpandedDesenvolvedores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(devId)) {
        newSet.delete(devId);
      } else {
        newSet.add(devId);
      }
      return newSet;
    });
  };

  // Adicione esta função antes do return do componente Home
  const exportToExcel = () => {
    try {
      // Prepara os dados para exportação
      const data = allProjetos.flatMap(projeto => {
        // Extrai todas as tarefas do kanban
        const tarefas = Object.entries(projeto.kanban || {}).flatMap(([status, tasks]) => {
          if (!Array.isArray(tasks)) return [];
          
          return tasks.map(task => ({
            'ID Tarefa': task.taskId || '',
            'Projeto': projeto.nome,
            'Título': task.titulo,
            'Descrição': task.content,
            'Status': getStatusDisplay(status),
            'Prioridade': task.prioridade || 'Não definida',
            'Responsável': Array.isArray(task.responsavel) 
              ? task.responsavel.map(r => r.label || r).join(', ')
              : task.responsavel?.label || task.responsavel || 'Não atribuído',
            'Data Início': task.dataInicio || '',
            'Data Conclusão': task.dataConclusao || '',
            'Número Chamado': task.numeroChamado || '',
            'Tags': task.tags?.map(tag => tag.texto).join(', ') || '',
            'Analista Principal': projeto.analistaPrincipal?.[0]?.label || 'Não definido',
            'Desenvolvedor Principal': projeto.desenvolvedorPrincipal?.[0]?.label || 'Não definido',
            'Tipo Projeto': projeto.tipo || 'Não definido',
            'Status Projeto': projeto.status || 'Em Andamento'
          }));
        });

        return tarefas;
      });

      // Cria uma nova planilha
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tarefas");

      // Ajusta a largura das colunas
      const colWidths = [
        { wch: 10 }, // ID Tarefa
        { wch: 30 }, // Projeto
        { wch: 40 }, // Título
        { wch: 50 }, // Descrição
        { wch: 15 }, // Status
        { wch: 15 }, // Prioridade
        { wch: 30 }, // Responsável
        { wch: 15 }, // Data Início
        { wch: 15 }, // Data Conclusão
        { wch: 15 }, // Número Chamado
        { wch: 30 }, // Tags
        { wch: 30 }, // Analista Principal
        { wch: 30 }, // Desenvolvedor Principal
        { wch: 20 }, // Tipo Projeto
        { wch: 20 }, // Status Projeto
      ];
      ws['!cols'] = colWidths;

      // Gera o arquivo e faz o download
      const fileName = `tarefas_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar os dados. Por favor, tente novamente.');
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="page-header">
          <h1 className="page-title">Início</h1>
          <button className="export-button" onClick={exportToExcel}>
            <FontAwesomeIcon icon={faFileExcel} />
            Exportar para Excel
          </button>
        </div>

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
            className={`card ${expandedCard === "projects" ? "expanded" : ""}`}
            onClick={handleIndicadorClick}
          >
            <h2>
              <FontAwesomeIcon icon={faTasks} /> Indicadores de Tarefas
            </h2>
            <div className="indicadores">
              <div className="indicador">
                <FontAwesomeIcon icon={faSpinner} className="icon aDefinir" />
                <span>A Definir: {indicadores.aDefinir}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faTasks} className="icon todo" />
                <span>A Fazer: {indicadores.todo}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="icon inProgress spin"
                />
                <span>Em Andamento: {indicadores.inProgress}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="icon testing"
                />
                <span>Em Teste: {indicadores.testing}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="icon prontoDeploy"
                />
                <span>Pronto para Deploy: {indicadores.prontoDeploy}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faCheckCircle} className="icon done" />
                <span>Concluído: {indicadores.done}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faArchive} className="icon arquivado" />
                <span>Arquivado: {indicadores.arquivado}</span>
              </div>
            </div>
          </div>

          <div
            className={`card ${
              expandedCard === "allProjects" ? "expanded" : ""
            }`}
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

          <div
            className={`card ${expandedCard === "analistas" ? "expanded" : ""}`}
            onClick={handleAnalistasClick}
          >
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
                    className={`indicador-item ${
                      analistaFiltrado === analista.nome ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnalistaFiltrado(
                        analistaFiltrado === analista.nome
                          ? null
                          : analista.nome
                      );
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

          <div
            className={`card ${
              expandedCard === "desenvolvedores" ? "expanded" : ""
            }`}
            onClick={handleDesenvolvedoresClick}
          >
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
                    className={`indicador-item ${
                      desenvolvedorFiltrado === dev.nome ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDesenvolvedorFiltrado(
                        desenvolvedorFiltrado === dev.nome ? null : dev.nome
                      );
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
        </div>

        {expandedCard === "projects" && (
          <div className="projetos-relacionados">
            <div className="projetos-section">
              <h3>
                <FontAwesomeIcon icon={faProjectDiagram} /> Visão Geral do
                Kanban
              </h3>
              {renderKanbanGeral()}
              {renderKanbanGraficos()}
            </div>
          </div>
        )}

        {expandedCard === "allProjects" && renderAllProjectsSection()}

        {expandedCard === "analistas" && renderAnalistasSection()}
        {expandedCard === "desenvolvedores" && renderDesenvolvedoresSection()}

        {isViewModalOpen && selectedTask && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="task-details">
                <div className="task-header">
                  <div className="task-id-header">
                    <span className="task-id">#{selectedTask.taskId}</span>
                  </div>
                  <h2>{selectedTask.titulo}</h2>
                  {selectedTask.numeroChamado && (
                    <span className="task-chamado">
                      Chamado: {selectedTask.numeroChamado}
                    </span>
                  )}
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div className="tags-container">
                    {selectedTask.tags.map((tag) => (
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
                      {Array.isArray(selectedTask.responsavel)
                        ? selectedTask.responsavel.join(", ")
                        : selectedTask.responsavel || "Não atribuído"}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">flag</i>
                      <h3>Status</h3>
                    </div>
                    <div className="info-card-content">
                      <span
                        className={`status-badge status-${selectedTask.status}`}
                      >
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
                      <span
                        className={`priority-badge priority-${selectedTask.prioridade}`}
                      >
                        {selectedTask.prioridade || "No definida"}
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">event</i>
                      <h3>Data Início</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.dataInicio || "Não definida"}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">event_available</i>
                      <h3>Data Conclusão</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.dataConclusao
                        ? format(
                            new Date(selectedTask.dataConclusao + "T00:00:00"),
                            "dd/MM/yyyy"
                          )
                        : "Não definida"}
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="material-icons">trending_up</i>
                      <h3>Progresso</h3>
                    </div>
                    <div className="info-card-content">
                      {selectedTask.progresso || "Não iniciada"}
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
                        className={`tab-button ${
                          activeCommentTab === "comentarios" ? "active" : ""
                        }`}
                        onClick={() => setActiveCommentTab("comentarios")}
                      >
                        <FontAwesomeIcon icon={faComment} />
                        Comentários
                      </button>
                      <button
                        className={`tab-button ${
                          activeCommentTab === "logs" ? "active" : ""
                        }`}
                        onClick={() => setActiveCommentTab("logs")}
                      >
                        <FontAwesomeIcon icon={faHistory} />
                        Logs
                      </button>
                    </div>
                    {activeCommentTab === "comentarios" &&
                      selectedTask.status !== "arquivado" && (
                        <button
                          className="add-comment-btn"
                          onClick={() => setShowCommentInput(!showCommentInput)}
                        >
                          <FontAwesomeIcon icon={faComment} />
                          Comentar
                        </button>
                      )}
                  </div>

                  {activeCommentTab === "comentarios" && (
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
                                setComentario("");
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
                          ?.filter((comment) => comment.tipo === "comentario")
                          .sort((a, b) => new Date(b.data) - new Date(a.data))
                          .map((comment) => (
                            <div
                              key={comment.data}
                              className="comment-item user-comment"
                            >
                              <div className="comment-header">
                                <div className="comment-user-info">
                                  <FontAwesomeIcon
                                    icon={faComment}
                                    className="comment-icon"
                                  />
                                  <span className="comment-user">
                                    {comment.usuario}
                                  </span>
                                </div>
                                <span className="comment-date">
                                  {format(
                                    new Date(comment.data),
                                    "dd/MM/yyyy 'às' HH:mm"
                                  )}
                                </span>
                              </div>
                              <p className="comment-text">{comment.detalhes}</p>
                            </div>
                          ))}
                      </div>
                    </>
                  )}

                  {activeCommentTab === "logs" && (
                    <div className="comments-list">
                      {comentarios[selectedTask.id]
                        ?.filter((comment) => comment.tipo !== "comentario")
                        .sort((a, b) => new Date(b.data) - new Date(a.data))
                        .map((log) => (
                          <div
                            key={log.data}
                            className={`comment-item system-log ${
                              log.tipo === "teste" ? "teste-log" : ""
                            }`}
                          >
                            <div className="comment-header">
                              <div className="comment-user-info">
                                <FontAwesomeIcon
                                  icon={
                                    log.tipo === "teste"
                                      ? faCheckCircle
                                      : log.tipo === "movimentacao"
                                      ? faExchange
                                      : faHistory
                                  }
                                  className="log-icon"
                                />
                                <span className="comment-user">
                                  {log.usuario}
                                </span>
                              </div>
                              <span className="comment-date">
                                {format(
                                  new Date(log.data),
                                  "dd/MM/yyyy 'às' HH:mm"
                                )}
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
