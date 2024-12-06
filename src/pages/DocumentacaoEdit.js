import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave,
  faBook,
  faFileContract,
  faVideo,
  faListCheck,
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './DocumentacaoForm.css';

const TEMPLATES = {
  manual: {
    label: 'Manual',
    sections: [
      { id: 'objetivo', label: 'Objetivo', type: 'text' },
      { id: 'escopo', label: 'Escopo', type: 'text' },
      { id: 'definicoes', label: 'Definições', type: 'text' },
      { id: 'procedimentos', label: 'Procedimentos', type: 'textarea' },
      { id: 'referencias', label: 'Referências', type: 'text' },
      { id: 'anexos', label: 'Anexos', type: 'text' }
    ]
  },
  especificacao: {
    label: 'Especificação',
    sections: [
      { id: 'introducao', label: 'Introdução', type: 'text' },
      { id: 'objetivos', label: 'Objetivos', type: 'text' },
      { id: 'requisitos_funcionais', label: 'Requisitos Funcionais', type: 'textarea' },
      { id: 'requisitos_nao_funcionais', label: 'Requisitos Não Funcionais', type: 'textarea' },
      { id: 'restricoes', label: 'Restrições', type: 'text' },
      { id: 'interfaces', label: 'Interfaces', type: 'textarea' },
      { id: 'casos_uso', label: 'Casos de Uso', type: 'textarea' }
    ]
  },
  tutorial: {
    label: 'Tutorial',
    sections: [
      { id: 'introducao', label: 'Introdução', type: 'text' },
      { id: 'pre_requisitos', label: 'Pré-requisitos', type: 'text' },
      { id: 'passo_a_passo', label: 'Passo a Passo', type: 'textarea' },
      { id: 'exemplos', label: 'Exemplos', type: 'textarea' },
      { id: 'solucao_problemas', label: 'Solução de Problemas', type: 'textarea' },
      { id: 'referencias', label: 'Referências', type: 'text' }
    ]
  },
  procedimento: {
    label: 'Procedimento',
    sections: [
      { id: 'objetivo', label: 'Objetivo', type: 'text' },
      { id: 'responsabilidades', label: 'Responsabilidades', type: 'text' },
      { id: 'documentos_referencia', label: 'Documentos de Referência', type: 'text' },
      { id: 'definicoes', label: 'Definições', type: 'text' },
      { id: 'descricao_atividades', label: 'Descrição das Atividades', type: 'textarea' },
      { id: 'fluxograma', label: 'Fluxograma', type: 'textarea' },
      { id: 'registros', label: 'Registros', type: 'text' }
    ]
  },
  relatorio: {
    label: 'Relatório',
    sections: [
      { id: 'sumario_executivo', label: 'Sumário Executivo', type: 'text' },
      { id: 'introducao', label: 'Introdução', type: 'text' },
      { id: 'metodologia', label: 'Metodologia', type: 'text' },
      { id: 'resultados', label: 'Resultados', type: 'textarea' },
      { id: 'analise', label: 'Análise', type: 'textarea' },
      { id: 'conclusoes', label: 'Conclusões', type: 'textarea' },
      { id: 'recomendacoes', label: 'Recomendações', type: 'text' }
    ]
  }
};

const DocumentacaoEdit = () => {
  const navigate = useNavigate();
  const { projetoId, documentoId } = useParams();
  const [projeto, setProjeto] = useState(null);
  const [documento, setDocumento] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar documento
        const documentoDoc = await getDoc(doc(db, 'documentos', documentoId));
        if (documentoDoc.exists()) {
          const documentoData = documentoDoc.data();
          setDocumento(documentoData);
          
          // Parse do conteúdo e setup do formData
          const conteudoObj = JSON.parse(documentoData.conteudo);
          setFormData({
            titulo: documentoData.titulo,
            ...conteudoObj
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { titulo, ...conteudo } = formData;
      const docRef = doc(db, 'documentos', documentoId);
      await updateDoc(docRef, {
        titulo,
        conteudo: JSON.stringify(conteudo),
        dataAtualizacao: new Date().toISOString()
      });
      navigate(`/documentacao/${projetoId}`);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
    }
  };

  if (!documento || !projeto) {
    return <div>Carregando...</div>;
  }

  const template = TEMPLATES[documento.tipo.toLowerCase()];

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
              Editar {template.label} - {projeto.nome}
            </h1>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="documentacao-form">
            <div className="form-group titulo">
              <label htmlFor="titulo">Título do Documento</label>
              <input
                id="titulo"
                type="text"
                value={formData.titulo || ''}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                placeholder="Digite o título do documento"
              />
            </div>

            <div className="form-section">
              <div className="form-section-title">
                <FontAwesomeIcon icon={TEMPLATES[documento.tipo.toLowerCase()].icon} />
                Conteúdo do Documento
              </div>
              
              {template.sections.map(section => (
                <div key={section.id} className="form-group">
                  <label htmlFor={section.id}>{section.label}</label>
                  {section.type === 'textarea' ? (
                    <textarea
                      id={section.id}
                      value={formData[section.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [section.id]: e.target.value })}
                      required
                      placeholder={`Digite ${section.label.toLowerCase()}`}
                      rows="5"
                    />
                  ) : (
                    <input
                      type="text"
                      id={section.id}
                      value={formData[section.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [section.id]: e.target.value })}
                      required
                      placeholder={`Digite ${section.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
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
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentacaoEdit; 