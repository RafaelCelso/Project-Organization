import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import './NotificationButton.css';

function NotificationButton() {
  return (
    <button className="notification-button">
      <FontAwesomeIcon icon={faBell} />
      <span className="notification-badge">3</span>
    </button>
  );
}

export default NotificationButton; 