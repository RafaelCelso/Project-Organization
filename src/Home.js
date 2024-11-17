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

  const renderTarefaCard = (tarefa) => (
    <div
      key={tarefa.id}
      className={`tarefa-card prioridade-${tarefa.prioridade}`}
    >
      <div className="tarefa-header">
        <div className="tarefa-id-titulo">
          <span className="tarefa-id">
            <FontAwesomeIcon icon={faHashtag} className="id-icon" />
            {tarefa.taskId}
          </span>
          <span className="tarefa-titulo">{tarefa.titulo}</span>
        </div>
        <span
          className={`tarefa-status status-${tarefa.status
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          {tarefa.status === "done"
            ? "Concluído"
            : tarefa.status === "inProgress"
            ? "Em Andamento"
            : tarefa.status === "todo"
            ? "A Fazer"
            : tarefa.status}
        </span>
      </div>
      <div className="tarefa-footer">
        <span className="tarefa-responsavel">
          {Array.isArray(tarefa.responsavel)
            ? tarefa.responsavel.join(", ")
            : tarefa.responsavel}
        </span>
        <span className={`tarefa-prioridade prioridade-${tarefa.prioridade}`}>
          {tarefa.prioridade?.charAt(0).toUpperCase() +
            tarefa.prioridade?.slice(1)}
        </span>
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

      // Calcula as porcentagens
      const todoPercent = total > 0 ? (todo / total) * 100 : 0;
      const doingPercent = total > 0 ? (doing / total) * 100 : 0;
      const donePercent = total > 0 ? (done / total) * 100 : 0;
      const vencidasPercent = total > 0 ? (vencidas / total) * 100 : 0;

      return {
        total,
        todo,
        doing,
        done,
        vencidas,
        todoPercent,
        doingPercent,
        donePercent,
        vencidasPercent
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
                <span>Em Andamento/Teste/Deploy</span>
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
                <span>Concluídas/Arquivadas</span>
                <span>{stats.donePercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill done"
                  style={{ width: `${stats.donePercent}%` }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <span>Vencidas</span>
                <span>{stats.vencidasPercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill warning"
                  style={{ width: `${stats.vencidasPercent}%` }}
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
        </div>

        {showProjects && (
          <div className="projetos-relacionados">
            <div className="projetos-section">
              <h3>
                <FontAwesomeIcon icon={faProjectDiagram} /> Projetos por Status
              </h3>

              <div className="projetos-grid">
                <div className="projeto-categoria">
                  <h4 className="success">
                    Concluídos ({projetos.concluidas?.length || 0})
                  </h4>
                  <div className="projeto-cards">
                    {projetos.concluidas?.map((projeto) =>
                      renderProjetoCard(projeto, "success")
                    )}
                  </div>
                </div>

                <div className="projeto-categoria">
                  <h4 className="warning">
                    Vencidos ({projetos.vencidas?.length || 0})
                  </h4>
                  <div className="projeto-cards">
                    {projetos.vencidas?.map((projeto) =>
                      renderProjetoCard(projeto, "warning")
                    )}
                  </div>
                </div>

                <div className="projeto-categoria">
                  <h4 className="info">
                    Em Andamento ({projetos.emAndamento?.length || 0})
                  </h4>
                  <div className="projeto-cards">
                    {projetos.emAndamento?.map((projeto) =>
                      renderProjetoCard(projeto, "info")
                    )}
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  );
}

export default Home;
