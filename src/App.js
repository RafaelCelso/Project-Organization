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
import Permissoes from './pages/Permissoes';
import AcessoNegado from './pages/AcessoNegado';
import Documentacao from './pages/Documentacao';
import './styles/global.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { syncPermissions, updateDesenvolvedorPermissions } from './services/permissionsService';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true'
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-sidebar-collapsed',
      isCollapsed.toString()
    );
    localStorage.setItem('sidebarCollapsed', isCollapsed);
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
          <Route 
            path="/projetos" 
            element={
              <ProtectedRoute menu="projetos">
                <Projetos />
              </ProtectedRoute>
            } 
          />
          <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/escalas" element={<Escalas />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute menu="usuarios">
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/permissoes" 
            element={
              <ProtectedRoute menu="permissoes">
                <Permissoes />
              </ProtectedRoute>
            } 
          />
          <Route path="/acesso-negado" element={<AcessoNegado />} />
          <Route 
            path="/documentacao" 
            element={
              <ProtectedRoute>
                <Documentacao />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        await syncPermissions();
        await updateDesenvolvedorPermissions();
        console.log('Permissões inicializadas com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar permissões:', error);
      }
    };

    initializePermissions();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;