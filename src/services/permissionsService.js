import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DEFAULT_PERMISSIONS } from '../config/defaultPermissions';

export const syncPermissions = async () => {
  try {
    // Busca todas as roles definidas em DEFAULT_PERMISSIONS
    const roles = Object.keys(DEFAULT_PERMISSIONS);

    for (const role of roles) {
      const permissoesRef = doc(db, 'permissoes', role.toLowerCase());
      const permissoesDoc = await getDoc(permissoesRef);

      const defaultPermissions = DEFAULT_PERMISSIONS[role];
      const permissoesData = {
        nome: role,
        descricao: `Permissões do perfil ${role}`,
        permissoes: {
          menus: { ...defaultPermissions.menus }, // Garante que todos os menus estejam definidos
          ...defaultPermissions.permissoes
        },
        atualizadoEm: new Date().toISOString()
      };

      if (!permissoesDoc.exists()) {
        await setDoc(permissoesRef, {
          ...permissoesData,
          criadoEm: new Date().toISOString()
        });
        console.log(`Permissões para ${role} criadas com sucesso`);
      } else {
        // Sempre atualiza para garantir que todos os menus estejam presentes
        await setDoc(permissoesRef, {
          ...permissoesDoc.data(),
          permissoes: permissoesData.permissoes,
          atualizadoEm: new Date().toISOString()
        });
        console.log(`Permissões para ${role} atualizadas com sucesso`);
      }
    }

    console.log('Sincronização de permissões concluída');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar permissões:', error);
    return false;
  }
};

// Função específica para atualizar as permissões do Desenvolvedor
export const updateDesenvolvedorPermissions = async () => {
  try {
    const desenvolvedorRef = doc(db, 'permissoes', 'desenvolvedor');
    const desenvolvedorPermissions = DEFAULT_PERMISSIONS.Desenvolvedor;

    await setDoc(desenvolvedorRef, {
      nome: 'Desenvolvedor',
      descricao: 'Responsável pelo desenvolvimento técnico dos projetos',
      permissoes: {
        menus: { ...desenvolvedorPermissions.menus },
        ...desenvolvedorPermissions.permissoes
      },
      atualizadoEm: new Date().toISOString()
    }, { merge: true });

    console.log('Permissões do Desenvolvedor atualizadas com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar permissões do Desenvolvedor:', error);
    return false;
  }
}; 