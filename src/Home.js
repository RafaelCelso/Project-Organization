import React from 'react';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faTasks, faCheckCircle, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './Home.css';

function Home() {
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

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content">
        <h1 className="page-title">Bem-vindo à Página Inicial</h1>
        
        <div className="cards-container">
          <div className="card">
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

          <div className="card">
            <h2><FontAwesomeIcon icon={faTasks} /> Indicadores de Tarefas</h2>
            <div className="indicadores">
              <div className="indicador">
                <FontAwesomeIcon icon={faCheckCircle} className="icon" />
                <span>Concluídas: {indicadores.concluidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
                <span>Vencidas: {indicadores.vencidas}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faSpinner} className="icon" />
                <span>Em Andamento: {indicadores.emAndamento}</span>
              </div>
              <div className="indicador">
                <FontAwesomeIcon icon={faCheckCircle} className="icon" />
                <span>Realizadas: {indicadores.realizadas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;