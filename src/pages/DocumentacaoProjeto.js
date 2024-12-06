import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faFileAlt, 
  faArrowLeft, 
  faTrash, 
  faEdit,
  faBook,
  faFileContract,
  faVideo,
  faListCheck,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import './DocumentacaoProjeto.css';

const TOPICOS = [
  { id: 'manual', nome: 'Manual', icon: faBook },
  { id: 'especificacao', nome: 'Especificação', icon: faFileContract },
  { id: 'tutorial', nome: 'Tutorial', icon: faVideo },
  { id: 'procedimento', nome: 'Procedimento', icon: faListCheck },
  { id: 'relatorio', nome: 'Relatório', icon: faChartLine }
];

const DocumentacaoProjeto = () => {
  const { projetoId } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState(null);
  const [documentos, setDocumentos] = useState({});
  const [topicoAtivo, setTopicoAtivo] = useState(() => {
    const savedTopico = localStorage.getItem(`topico-${projetoId}`);
    return savedTopico || null;
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

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

    const fetchDocumentos = async () => {
      try {
        const q = query(
          collection(db, 'documentos'),
          where('projetoId', '==', projetoId)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Organizar documentos por tópico
        const docsOrganizados = TOPICOS.reduce((acc, topico) => {
          acc[topico.id] = docs.filter(doc => doc.tipo.toLowerCase() === topico.id);
          return acc;
        }, {});

        setDocumentos(docsOrganizados);
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
      }
    };

    fetchProjeto();
    fetchDocumentos();
  }, [projetoId]);

  const handleNovoDocumento = () => {
    navigate(`/documentacao/${projetoId}/novo?tipo=${topicoAtivo}`);
  };

  const handleDocumentoClick = (documento) => {
    navigate(`/documentacao/${projetoId}/documento/${documento.id}`);
  };

  const handleEditClick = (e, documento) => {
    e.stopPropagation();
    navigate(`/documentacao/${projetoId}/editar/${documento.id}`);
  };

  const handleDeleteClick = async (e, documento) => {
    e.stopPropagation();
    setDocToDelete(documento);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'documentos', docToDelete.id));
      setDocumentos(prev => ({
        ...prev,
        [docToDelete.tipo.toLowerCase()]: prev[docToDelete.tipo.toLowerCase()].filter(doc => doc.id !== docToDelete.id)
      }));
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const handleTopicoClick = (topicoId) => {
    const novoTopico = topicoAtivo === topicoId ? null : topicoId;
    setTopicoAtivo(novoTopico);
    if (novoTopico) {
      localStorage.setItem(`topico-${projetoId}`, novoTopico);
    } else {
      localStorage.removeItem(`topico-${projetoId}`);
    }
  };

  useEffect(() => {
    return () => {
      // Não limpar ao desmontar para manter o estado
      // localStorage.removeItem(`topico-${projetoId}`);
    };
  }, [projetoId]);

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="page-header">
          <div className="header-left">
            <button 
              className="back-button"
              onClick={() => navigate('/documentacao')}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className="page-title">
              {projeto?.nome} - Documentaão
            </h1>
          </div>
        </div>

        <div className="topicos-container">
          {TOPICOS.map(topico => (
            <div 
              key={topico.id}
              className={`topico-card ${topicoAtivo === topico.id ? 'active' : ''}`}
              onClick={() => handleTopicoClick(topico.id)}
            >
              <FontAwesomeIcon icon={topico.icon} className="topico-icon" />
              <h3>{topico.nome}</h3>
              <span className="documento-count">
                {documentos[topico.id]?.length || 0} documentos
              </span>
            </div>
          ))}
        </div>

        {topicoAtivo && (
          <>
            <div className="topico-header">
              <h2>
                <FontAwesomeIcon 
                  icon={TOPICOS.find(t => t.id === topicoAtivo)?.icon} 
                /> {TOPICOS.find(t => t.id === topicoAtivo)?.nome}
              </h2>
              <button
                className="new-doc-btn"
                onClick={handleNovoDocumento}
              >
                <FontAwesomeIcon icon={faPlus} />
                Novo Documento
              </button>
            </div>

            <div className="documentos-table">
              <div className="table-header">
                <div className="col-titulo">Título</div>
                <div className="col-data">Data de Criação</div>
                <div className="col-data">Última Atualização</div>
                <div className="col-autor">Autor</div>
                <div className="col-acoes">Ações</div>
              </div>
              
              {documentos[topicoAtivo]?.length > 0 ? (
                <div className="table-body">
                  {documentos[topicoAtivo].map((documento) => (
                    <div 
                      key={documento.id} 
                      className="table-row"
                      onClick={() => handleDocumentoClick(documento)}
                    >
                      <div className="col-titulo">
                        <FontAwesomeIcon icon={faFileAlt} className="documento-icon" />
                        {documento.titulo}
                      </div>
                      <div className="col-data">
                        {new Date(documento.dataCriacao).toLocaleDateString()}
                      </div>
                      <div className="col-data">
                        {documento.dataAtualizacao 
                          ? new Date(documento.dataAtualizacao).toLocaleDateString()
                          : 'Não atualizado'}
                        </div>
                      <div className="col-autor">
                        {documento.autor}
                      </div>
                      <div className="col-acoes">
                        <button 
                          className="action-btn edit"
                          onClick={(e) => handleEditClick(e, documento)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => handleDeleteClick(e, documento)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-documents">
                  <FontAwesomeIcon icon={faFileAlt} />
                  <p>Nenhum documento cadastrado neste tópico</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir o documento "{docToDelete?.titulo}"?</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDocToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={handleConfirmDelete}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentacaoProjeto; 