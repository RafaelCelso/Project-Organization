import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './DocumentacaoView.css';

const DocumentacaoView = () => {
  const { projetoId, documentoId } = useParams();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState(null);
  const [projeto, setProjeto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar documento
        const documentoDoc = await getDoc(doc(db, 'documentos', documentoId));
        if (documentoDoc.exists()) {
          setDocumento({ id: documentoDoc.id, ...documentoDoc.data() });
        }

        // Buscar projeto
        const projetoDoc = await getDoc(doc(db, 'projetos', projetoId));
        if (projetoDoc.exists()) {
          setProjeto({ id: projetoDoc.id, ...projetoDoc.data() });
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, [projetoId, documentoId]);

  if (!documento || !projeto) {
    return <div>Carregando...</div>;
  }

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
              {projeto.nome} - {documento.titulo}
            </h1>
          </div>
          <div className="header-actions">
            <button
              className="edit-btn"
              onClick={() => navigate(`/documentacao/${projetoId}/editar/${documento.id}`)}
            >
              <FontAwesomeIcon icon={faEdit} />
              Editar Documento
            </button>
          </div>
        </div>

        <div className="documento-container">
          <div className="documento-meta">
            <span className="documento-tipo-badge">{documento.tipo}</span>
            <span>Criado em: {new Date(documento.dataCriacao).toLocaleDateString()}</span>
            <span>Por: {documento.autor}</span>
          </div>
          <div className="documento-content">
            {documento.conteudo}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentacaoView; 