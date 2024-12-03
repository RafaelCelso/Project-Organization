import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('authUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error('Usuário não encontrado no Firestore');
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userPermissao = String(userData.permissao || '').trim();
        setUserRole(userPermissao);

        // Busca as permissões do Firestore
        const permissoesRef = doc(db, 'permissoes', userPermissao.toLowerCase());
        const permissoesDoc = await getDoc(permissoesRef);

        if (permissoesDoc.exists()) {
          const permissions = permissoesDoc.data().permissoes;
          console.log('Permissões carregadas do Firestore:', permissions);
          setUserPermissions(permissions);
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const isAdmin = () => {
    return userRole === 'Administrador';
  };

  const hasAccess = (menu) => {
    if (loading) return false;
    if (isAdmin()) return true;
    if (!userPermissions?.menus) return false;

    // Verifica explicitamente se a permissão do menu é true
    const hasMenuAccess = userPermissions.menus[menu] === true;
    console.log(`Verificando acesso ao menu ${menu}:`, {
      permissoes: userPermissions.menus,
      resultado: hasMenuAccess
    });
    return hasMenuAccess;
  };

  return { userRole, loading, hasAccess, userPermissions, isAdmin };
}; 