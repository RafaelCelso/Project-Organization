import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().cargo);
        }
      } catch (error) {
        console.error('Erro ao buscar cargo do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const can = (action) => {
    const permissions = {
      ADMIN: ['create', 'read', 'update', 'delete'],
      MANAGER: ['create', 'read', 'update'],
      USER: ['read']
    };

    return !loading && userRole && permissions[userRole]?.includes(action);
  };

  return { userRole, loading, can };
}; 