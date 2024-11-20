import React from 'react';
import './ToggleButton.css';

function ToggleButton({ isCollapsed, onClick }) {
  return (
    <button onClick={onClick} className="toggle-button">
      {isCollapsed ? '>' : '<'}
    </button>
  );
}

export default ToggleButton; 