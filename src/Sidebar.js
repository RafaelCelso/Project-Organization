import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faProjectDiagram, faUsers, faCalendarAlt, faTasks, faChartBar, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import logo from './logo.png'; // Importe a imagem

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Atualiza o atributo no elemento root quando o estado muda
    document.documentElement.setAttribute(
      'data-sidebar-collapsed',
      isCollapsed.toString()
    );
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    alert('Logout realizado!');
    navigate('/login');
  };

  const menuItems = [
    { icon: faHome, label: 'Início', path: '/' },
    { icon: faProjectDiagram, label: 'Projetos', path: '/projetos' },
    { icon: faUsers, label: 'Colaboradores', path: '/colaboradores' },
    { icon: faCalendarAlt, label: 'Escalas', path: '/escalas' },
    { icon: faTasks, label: 'Tarefas', path: '/tarefas' },
    { icon: faChartBar, label: 'Relatórios', path: '/relatorios' },
    { icon: faUser, label: 'Perfil', path: '/perfil' },
  ];

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <img src={logo} alt="Logo" className="sidebar-logo" />
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.label}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              <FontAwesomeIcon icon={item.icon} />
              {!isCollapsed && <span>{item.label}</span>}
            </li>
          ))}
          <li onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            {!isCollapsed && <span>Sair</span>}
          </li>
        </ul>
      </div>
      <button onClick={toggleSidebar} className="toggle-btn">
        {isCollapsed ? '>' : '<'}
      </button>
    </>
  );
}

export default Sidebar;