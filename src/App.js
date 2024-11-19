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
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/escalas" element={<Escalas />} />
        <Route path="/tarefas" element={<Tarefas />} />
      </Routes>
    </Router>
  );
}

export default App;