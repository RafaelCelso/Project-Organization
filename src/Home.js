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

  const loadProjetos = async () => {
    try {
      const projetosRef = collection(db, "projetosTarefas");
      const snapshot = await getDocs(projetosRef);

      const projetosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const novosIndicadores = {
        realizadas: 0,
        vencidas: 0,
        concluidas: 0,
        emAndamento: 0,
      };

      const projetosAgrupados = {
        concluidas: [],
        vencidas: [],
        emAndamento: [],
      };

      projetosData.forEach((projeto) => {
        if (!projeto.kanban) return;

        Object.values(projeto.kanban).forEach((coluna) => {
          coluna.forEach((tarefa) => {
            if (tarefa.status === "done") {
              novosIndicadores.concluidas++;
              novosIndicadores.realizadas++;
            } else if (tarefa.status === "inProgress") {
              novosIndicadores.emAndamento++;
            }

            if (
              tarefa.dataConclusao &&
              new Date(tarefa.dataConclusao) < new Date()
            ) {
              novosIndicadores.vencidas++;
            }
          });
        });

        const tarefasConcluidas = projeto.kanban.done?.length || 0;
        const tarefasTotal = Object.values(projeto.kanban).reduce(
          (acc, col) => acc + col.length,
          0
        );

        if (tarefasConcluidas === tarefasTotal && tarefasTotal > 0) {
          projetosAgrupados.concluidas.push(projeto);
        } else if (novosIndicadores.vencidas > 0) {
          projetosAgrupados.vencidas.push(projeto);
        } else {
          projetosAgrupados.emAndamento.push(projeto);
        }
      });

      setIndicadores(novosIndicadores);
      setProjetos(projetosAgrupados);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const eventosRef = collection(db, "eventos");
        const querySnapshot = await getDocs(eventosRef);
        
        const eventosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start: new Date(doc.data().start),
          end: new Date(doc.data().end)
        }));

        // Filtra eventos do mês atual e futuros
        const eventosFiltrados = eventosData
          .filter(evento => {
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
    if (showProjects) {
      loadProjetos();
    }
  }, [showProjects]);

  const handleIndicadorClick = () => {
    setShowProjects(!showProjects);
  };

  const handleProjetoClick = (projeto) => {
    navigate("/tarefas", { state: { selectedProjectId: projeto.id } });
  };

  const handleEventosClick = () => {
    navigate("/escalas");
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

    return (
      <div
        key={projeto.id}
        className={`projeto-card ${statusClass}`}
        onClick={() => handleProjetoClick(projeto)}
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
          <span>Responsável: {projeto.desenvolvedor || "Não definido"}</span>
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
                eventos.map(evento => (
                  <li key={evento.id}>
                    <span>{evento.title}</span>
                    <span>{format(new Date(evento.start), 'dd/MM/yyyy')}</span>
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
      </div>
    </div>
  );
}

export default Home;
