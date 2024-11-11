import React from 'react';
import Sidebar from './Sidebar';
import './Projetos.css';

function Home() {
  return (
    <div className="projetos-container">
      <Sidebar />
      <div className="projetos-content">
        <h1 className="page-title">Bem-vindo à Página Inicial</h1>
        {/* Conteúdo da página */}
      </div>
    </div>
  );
}

export default Home;