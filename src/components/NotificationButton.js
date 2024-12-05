import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './NotificationButton.css';

function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [colaboradorId, setColaboradorId] = useState(null);
  const auth = getAuth();

  // Primeiro useEffect para buscar o ID do colaborador baseado no usuário autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Buscar o documento do colaborador onde userId === user.uid
          const colaboradoresRef = collection(db, 'colaboradores');
          const q = query(colaboradoresRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const colaboradorDoc = querySnapshot.docs[0];
            console.log('Colaborador encontrado:', colaboradorDoc.id);
            setColaboradorId(colaboradorDoc.id);
          } else {
            console.log('Nenhum colaborador encontrado para o usuário:', user.uid);
          }
        } catch (error) {
          console.error('Erro ao buscar colaborador:', error);
        }
      } else {
        setColaboradorId(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Segundo useEffect para buscar notificações usando o ID do colaborador
  useEffect(() => {
    if (!colaboradorId) {
      console.log('Nenhum colaborador ID disponível');
      return;
    }

    console.log('Buscando notificações para colaborador:', colaboradorId);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', colaboradorId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot recebido:', {
        total: snapshot.docs.length,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      });
      
      const newNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [colaboradorId]);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `Há ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Há ${diffInDays} dias`;
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  return (
    <div className="notification-container">
      <button className="notification-button" onClick={handleClick}>
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <button 
                      className="mark-as-read"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="no-notifications">
              Não há novas notificações
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationButton; 