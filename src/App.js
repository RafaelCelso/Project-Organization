import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';
import Home from './Home';
import Login from './Login';
import Projetos from './Projetos';
import Colaboradores from './Colaboradores';
import Escalas from './Escalas';
import Tarefas from './Tarefas';
import ProjetoDetalhes from './ProjetoDetalhes';
import Perfil from './pages/Perfil';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/escalas" element={<Escalas />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;