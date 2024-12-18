import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import './DocumentacaoForm.css';

const TOPICOS = [
  { id: 'manual', nome: 'Manual', icon: faBook },
  { id: 'especificacao', nome: 'Especificação', icon: faFileContract },
  { id: 'tutorial', nome: 'Tutorial', icon: faVideo },
  { id: 'procedimento', nome: 'Procedimento', icon: faListCheck },
  { id: 'relatorio', nome: 'Relatório', icon: faChartLine }
];

// Templates para cada tipo de documento
const TEMPLATES = {
  manual: {
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

const DocumentacaoForm = () => {
  const navigate = useNavigate();
  const { projetoId } = useParams();
  const [searchParams] = useSearchParams();
  const tipoDoc = searchParams.get('tipo');
  const [projeto, setProjeto] = useState(null);
  const [formData, setFormData] = useState({});

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

    // Inicializar formData com seções vazias do template
    if (tipoDoc && TEMPLATES[tipoDoc]) {
      const initialData = TEMPLATES[tipoDoc].sections.reduce((acc, section) => {
        acc[section.id] = '';
        return acc;
      }, {});
      setFormData(initialData);
    }
  }, [projetoId, tipoDoc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docData = {
        projetoId,
        tipo: tipoDoc,
        titulo: formData.titulo || 'Sem título',
        conteudo: JSON.stringify(formData),
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

  if (!tipoDoc || !TEMPLATES[tipoDoc]) {
    return <div>Tipo de documento inválido</div>;
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
              Novo {TEMPLATES[tipoDoc].label} - {projeto?.nome}
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
                <FontAwesomeIcon icon={TOPICOS.find(t => t.id === tipoDoc)?.icon} />
                Conteúdo do Documento
              </div>
              
              {TEMPLATES[tipoDoc].sections.map(section => (
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