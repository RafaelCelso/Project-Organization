import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { usePermissions } from '../hooks/usePermissions';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './Documentacao.css';

const Documentacao = () => {
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();
  const [projetos, setProjetos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    projeto: '',
    tipo: '',
    conteudo: ''
  });

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const projetosRef = collection(db, 'projetos');
        const snapshot = await getDocs(projetosRef);
        const projetosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjetos(projetosData);
      } catch (error) {
        console.error('Erro ao buscar projetos:', error);
      }
    };

    fetchProjetos();
  }, []);

  const handleNovoDocumento = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  const handleProjetoClick = (projetoId) => {
    navigate(`/documentacao/${projetoId}`);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="page-header">
          <h1 className="page-title">Documentação dos Projetos</h1>
        </div>

        <div className="projects-grid">
          {projetos.map((projeto) => (
            <div 
              key={projeto.id} 
              className="project-card simple"
              onClick={() => handleProjetoClick(projeto.id)}
            >
              <div className="project-card-header">
                <FontAwesomeIcon icon={faFileAlt} className="project-icon" />
                <h3>{projeto.nome}</h3>
              </div>
              <div className="project-type-badge">{projeto.tipo || 'Não definido'}</div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Novo Documento</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Projeto</label>
                  <select
                    value={formData.projeto}
                    onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                    required
                  >
                    <option value="">Selecione um projeto...</option>
                    {projetos.map(projeto => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Manual">Manual</option>
                    <option value="Especificação">Especificação</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Conteúdo</label>
                  <textarea
                    value={formData.conteudo}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documentacao; 