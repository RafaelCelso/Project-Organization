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

      console.log('[usePermissions] Current user:', user);

      if (!user) {
        console.log('[usePermissions] No user found');
        setLoading(false);
        return;
      }

      try {
        // Primeiro, buscar todos os documentos de usuário que correspondam ao authUid
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('authUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error('[usePermissions] Usuário não encontrado no Firestore');
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('[usePermissions] User document:', userData);

        // Garantir que a permissão seja string e normalizada
        const userPermissao = String(userData.permissao || '').trim();
        setUserRole(userPermissao);
        
        console.log('[usePermissions] Permissão normalizada:', userPermissao);
        
        // Verifica se é admin (case insensitive)
        const isAdminUser = userPermissao.toLowerCase() === 'administrador';
        
        console.log('[usePermissions] É admin?', isAdminUser, 'Permissão:', userPermissao);

        if (isAdminUser) {
          const adminPermissions = {
            menus: {
              projetos: true,
              usuarios: true,
              permissoes: true,
              colaboradores: true,
              tarefas: true,
              escalas: true,
            },
            projetos: {
              visualizar: true,
              criar: true,
              editar: true,
              excluir: true
            },
            usuarios: {
              visualizar: true,
              criar: true,
              editar: true,
              excluir: true
            },
            permissoes: {
              visualizar: true,
              criar: true,
              editar: true,
              excluir: true
            }
          };
          
          setUserPermissions(adminPermissions);
          console.log('[usePermissions] Permissões de admin definidas:', adminPermissions);
        } else {
          // Buscar permissões específicas do perfil
          const permissoesRef = doc(db, 'permissoes', userPermissao.toLowerCase());
          const permissoesDoc = await getDoc(permissoesRef);
          
          if (permissoesDoc.exists()) {
            setUserPermissions(permissoesDoc.data().permissoes);
            console.log('[usePermissions] Permissões carregadas:', permissoesDoc.data().permissoes);
          }
        }
      } catch (error) {
        console.error('[usePermissions] Erro ao buscar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const isAdmin = () => {
    // Simplifica a verificação para apenas comparar com "Administrador"
    const adminCheck = String(userRole || '').toLowerCase() === 'administrador';
    console.log('[usePermissions] isAdmin check:', { userRole, result: adminCheck });
    return adminCheck;
  };

  const can = (action, categoria = null) => {
    console.log('[usePermissions] can check:', { action, categoria, isAdmin: isAdmin() });
    if (loading) return false;
    if (isAdmin()) return true;
    if (!userPermissions) return false;

    // Se não especificar categoria, verifica se tem permissão em qualquer categoria
    if (!categoria) {
      return Object.values(userPermissions).some(cat => 
        Object.entries(cat).some(([key, value]) => key === action && value === true)
      );
    }

    // Verifica permissão específica na categoria
    return userPermissions[categoria]?.[action] === true;
  };

  const hasAccess = (menu) => {
    console.log('[usePermissions] hasAccess check:', { menu, isAdmin: isAdmin() });
    if (loading) return false;
    if (isAdmin()) return true;
    if (!userPermissions) return false;
    return userPermissions.menus?.[menu] === true;
  };

  return { userRole, loading, can, hasAccess, userPermissions, isAdmin };
}; 