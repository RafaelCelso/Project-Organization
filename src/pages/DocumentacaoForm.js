import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebaseConfig';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import './DocumentacaoForm.css';

const DocumentacaoForm = () => {
  const navigate = useNavigate();
  const { projetoId } = useParams();
  const [projeto, setProjeto] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    conteudo: '',
    anexos: []
  });

  useEffect(() => {
    const fetchProjeto = async () => {
      try {
        const projetoDoc = await getDoc(doc(db, 'projetos', projetoId));
        if (projetoDoc.exists()) {
          setProjeto({ id: projetoDoc.id, ...projetoDoc.data() });
        }
      } catch (error) {
        console.error('Erro ao buscar projeto:', error);
      }
    };

    fetchProjeto();
  }, [projetoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docData = {
        ...formData,
        projetoId,
        dataCriacao: new Date().toISOString(),
        autor: 'Usuário Atual', // Você deve pegar o usuário logado aqui
        status: 'ativo'
      };

      await addDoc(collection(db, 'documentos'), docData);
      navigate(`/documentacao/${projetoId}`);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="page-header">
          <div className="header-left">
            <button 
              className="back-button"
              onClick={() => navigate(`/documentacao/${projetoId}`)}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="page-title">
              Novo Documento - {projeto?.nome}
            </h1>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="documentacao-form">
            <div className="form-group">
              <label htmlFor="titulo">Título do Documento</label>
              <input
                id="titulo"
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                placeholder="Digite o título do documento"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de Documento</label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                <option value="">Selecione o tipo</option>
                <option value="Manual">Manual</option>
                <option value="Especificação">Especificação</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Procedimento">Procedimento</option>
                <option value="Relatório">Relatório</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="conteudo">Conteúdo</label>
              <textarea
                id="conteudo"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                required
                placeholder="Digite o conteúdo do documento"
                rows="15"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate(`/documentacao/${projetoId}`)}
              >
                Cancelar
              </button>
              <button type="submit" className="save-btn">
                <FontAwesomeIcon icon={faSave} />
                Salvar Documento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentacaoForm;