import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faTasks, 
  faCheckCircle, 
  faExclamationTriangle, 
  faSpinner,
  faProjectDiagram,
  faHashtag
} from '@fortawesome/free-solid-svg-icons';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [showProjects, setShowProjects] = useState(false);

  const eventos = [
    { id: 1, titulo: 'Reunião de Planejamento', data: '2023-10-15' },
    { id: 2, titulo: 'Workshop de Inovação', data: '2023-10-20' },
  ];

  const indicadores = {
    realizadas: 10,
    vencidas: 5,
    concluidas: 15,
    emAndamento: 8,
  };

  const projetosRelacionados = {
    realizadas: [
      { 
        id: 1, 
        nome: 'Projeto A', 
        tipo: 'SAC', 
        status: 'Concluído', 
        responsavel: 'Ana Silva',
        tarefas: [
          { id: 1, titulo: 'Implementar Login', status: 'Concluído', responsavel: 'João Santos', prioridade: 'alta' },
          { id: 2, titulo: 'Criar API', status: 'Concluído', responsavel: 'Maria Silva', prioridade: 'média' }
        ]
      },
      { id: 2, nome: 'Projeto B', tipo: 'OL', status: 'Concluído', responsavel: 'João Santos' },
    ],
    vencidas: [
      {
        id: 3,
        nome: 'Projeto C',
        tipo: 'SAC',
        status: 'Atrasado',
        responsavel: 'Maria Oliveira',
        tarefas: [
          { id: 5, titulo: 'Corrigir Bug #123', status: 'Atrasado', responsavel: 'Pedro Costa', prioridade: 'alta' },
          { id: 6, titulo: 'Atualizar Documentação', status: 'Atrasado', responsavel: 'Ana Silva', prioridade: 'baixa' }
        ]
      },
      { id: 4, nome: 'Projeto D', tipo: 'OL', status: 'Atrasado', responsavel: 'Pedro Costa' },
    ],
    concluidas: [
      { id: 5, nome: 'Projeto E', tipo: 'SAC', status: 'Concluído', responsavel: 'Carlos Silva' },
      { id: 6, nome: 'Projeto F', tipo: 'OL', status: 'Concluído', responsavel: 'Paula Santos' },
    ],
    emAndamento: [
      {
        id: 7,
        nome: 'Projeto G',
        tipo: 'SAC',
        status: 'Em Andamento',
        responsavel: 'Roberto Lima',
        tarefas: [
          { id: 9, titulo: 'Desenvolver Dashboard', status: 'Em Andamento', responsavel: 'Carlos Silva', prioridade: 'média' },
          { id: 10, titulo: 'Implementar Relatórios', status: 'Em Andamento', responsavel: 'Julia Santos', prioridade: 'alta' }
        ]
      },
      { id: 8, nome: 'Projeto H', tipo: 'OL', status: 'Em Andamento', responsavel: 'Lucia Costa' },
    ],
  };

  const handleIndicadorClick = () => {
    setShowProjects(!showProjects);
  };

  const handleProjetoClick = (projeto) => {
    navigate('/tarefas', { state: { selectedProjectId: projeto.id } });
  };

  const handleEventosClick = () => {
    navigate('/escalas');
  };

  const renderTarefaCard = (tarefa) => (
    <div key={tarefa.id} className={`tarefa-card prioridade-${tarefa.prioridade}`}>
      <div className="tarefa-header">
        <div className="tarefa-id-titulo">
          <span className="tarefa-id">
            <FontAwesomeIcon icon={faHashtag} className="id-icon" />
            {tarefa.id}
          </span>
          <span className="tarefa-titulo">{tarefa.titulo}</span>
        </div>
        <span className={`tarefa-status status-${tarefa.status.toLowerCase().replace(' ', '-')}`}>
          {tarefa.status}
        </span>
      </div>
      <div className="tarefa-footer">
        <span className="tarefa-responsavel">{tarefa.responsavel}</span>
        <span className={`tarefa-prioridade prioridade-${tarefa.prioridade}`}>
          {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
        </span>
      </div>
    </div>
  );

  const renderProjetoCard = (projeto, statusClass) => (
    <div 
      key={projeto.id} 
      className={`projeto-card ${statusClass}`}
      onClick={() => handleProjetoClick(projeto)}
    >
      <h5>{projeto.nome}</h5>
      <div className="projeto-info">
        <span className="tipo">{projeto.tipo}</span>
        <span className="status">{projeto.status}</span>
      </div>
      <div className="responsavel">
        <span>Responsável: {projeto.responsavel}</span>
      </div>
      
      {/* Seção de Tarefas */}
      <div className="projeto-tarefas">
        <h6>Tarefas</h6>
        <div className="tarefas-list">
          {projeto.tarefas?.map(tarefa => renderTarefaCard(tarefa))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content">
        <h1 className="page-title">Bem-vindo à Página Inicial</h1>
        
        <div className="cards-container">
          <div className="card" onClick={handleEventosClick}>
            <h2><FontAwesomeIcon icon={faCalendarAlt} /> Próximos Eventos</h2>
            <ul>
              {eventos.map(evento => (
                <li key={evento.id}>
                  <span>{evento.titulo}</span>
                  <span>{new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`card ${showProjects ? 'expanded' : ''}`} onClick={handleIndicadorClick}>
            <h2><FontAwesomeIcon icon={faTasks} /> Indicadores de Tarefas</h2>
            <div className="indicadores">
              <div className="indicador">
                <FontAwesomeIcon icon={faCheckCircle} className="icon success" />
                <span>Concluídas: {indicadores.concluidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faExclamationTriangle} className="icon warning" />
                <span>Vencidas: {indicadores.vencidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faSpinner} className="icon spin" />
                <span>Em Andamento: {indicadores.emAndamento}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faCheckCircle} className="icon success" />
                <span>Realizadas: {indicadores.realizadas}</span>
              </div>
            </div>
          </div>
        </div>

        {showProjects && (
          <div className="projetos-relacionados">
            <div className="projetos-section">
              <h3><FontAwesomeIcon icon={faProjectDiagram} /> Projetos por Status</h3>
              
              <div className="projetos-grid">
                <div className="projeto-categoria">
                  <h4 className="success">Concluídos ({projetosRelacionados.concluidas?.length})</h4>
                  <div className="projeto-cards">
                    {projetosRelacionados.concluidas?.map(projeto => 
                      renderProjetoCard(projeto, 'success')
                    )}
                  </div>
                </div>

                <div className="projeto-categoria">
                  <h4 className="warning">Vencidos ({projetosRelacionados.vencidas?.length})</h4>
                  <div className="projeto-cards">
                    {projetosRelacionados.vencidas?.map(projeto => 
                      renderProjetoCard(projeto, 'warning')
                    )}
                  </div>
                </div>

                <div className="projeto-categoria">
                  <h4 className="info">Em Andamento ({projetosRelacionados.emAndamento?.length})</h4>
                  <div className="projeto-cards">
                    {projetosRelacionados.emAndamento?.map(projeto => 
                      renderProjetoCard(projeto, 'info')
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