import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Projetos from './Projetos';
import Colaboradores from './Colaboradores';
import Escalas from './Escalas';
import Tarefas from './Tarefas';
import ProjetoDetalhes from './ProjetoDetalhes';

function App() {
  const [projetos, setProjetos] = useState([
    {
      id: 1,
      nome: "Projeto A",
      tipo: "SAC",
      analistaPrincipal: "Ana Silva",
      analistaBackup: "João Santos",
      desenvolvedorPrincipal: "Pedro Costa",
      desenvolvedorBackup: "Maria Oliveira",
      status: "Ativo",
      cliente: "Empresa XYZ",
      contatoCliente: {
        email: "contato@xyz.com",
        telefone: "(11) 99999-9999"
      },
      supervisorPrincipal: "Carlos Souza",
      supervisorBackup: "Patrícia Lima"
    }
  ]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/projetos" element={<Projetos projetos={projetos} setProjetos={setProjetos} />} />
        <Route path="/projetos/:id" element={<ProjetoDetalhes projetos={projetos} setProjetos={setProjetos} />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/escalas" element={<Escalas />} />
        <Route path="/tarefas" element={<Tarefas />} />
      </Routes>
    </Router>
  );
}

export default App;