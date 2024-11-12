import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const colaboradoresService = {
  // Buscar todos os colaboradores
  getAll: async () => {
    try {
      const colaboradoresRef = collection(db, 'colaboradores');
      const snapshot = await getDocs(colaboradoresRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
      throw error;
    }
  },

  // Buscar colaboradores por projeto
  getByProjeto: async (projetoId) => {
    try {
      const colaboradoresRef = collection(db, 'colaboradores');
      const q = query(colaboradoresRef, where("projeto", "array-contains", projetoId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Erro ao buscar colaboradores por projeto:", error);
      throw error;
    }
  },

  // Criar novo colaborador
  create: async (colaboradorData) => {
    try {
      const colaboradoresRef = collection(db, 'colaboradores');
      const docRef = await addDoc(colaboradoresRef, colaboradorData);
      return {
        id: docRef.id,
        ...colaboradorData
      };
    } catch (error) {
      console.error("Erro ao criar colaborador:", error);
      throw error;
    }
  },

  // Atualizar colaborador existente
  update: async (id, colaboradorData) => {
    try {
      const colaboradorRef = doc(db, 'colaboradores', id);
      await updateDoc(colaboradorRef, colaboradorData);
      return {
        id,
        ...colaboradorData
      };
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error);
      throw error;
    }
  },

  // Excluir colaborador
  delete: async (id) => {
    try {
      const colaboradorRef = doc(db, 'colaboradores', id);
      await deleteDoc(colaboradorRef);
      return id;
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      throw error;
    }
  }
}; 