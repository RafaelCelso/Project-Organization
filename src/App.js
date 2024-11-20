import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Home from './Home';
import Login from './Login';
import Projetos from './Projetos';
import Colaboradores from './Colaboradores';
import Escalas from './Escalas';
import Tarefas from './Tarefas';
import ProjetoDetalhes from './ProjetoDetalhes';
import Perfil from './pages/Perfil';
import Users from './pages/Users';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-sidebar-collapsed',
      isCollapsed.toString()
    );
  }, [isCollapsed]);

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="App">
      {!isLoginPage && (
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggle={handleToggleSidebar}
        />
      )}
      <div className={`main-content ${isLoginPage ? 'login-page' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/escalas" element={<Escalas />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/usuarios" element={<Users />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;