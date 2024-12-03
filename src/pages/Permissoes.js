import React, { useState, useEffect } from 'react';
import './Permissoes.css';
import { db } from '../firebaseConfig';
import { doc, updateDoc, collection, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faKey, 
  faUserShield, 
  faLock, 
  faChevronDown, 
  faChevronUp,
  faSave,
  faTimes,
  faSpinner,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

function Permissoes() {
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [permissoesEditadas, setPermissoesEditadas] = useState({});
  const [status, setStatus] = useState({ role: '', state: '' });
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [permissoesSalvas, setPermissoesSalvas] = useState({});

  useEffect(() => {
    const carregarPermissoes = async () => {
      try {
        const permissoesRef = collection(db, 'permissoes');
        const snapshot = await getDocs(permissoesRef);
        
        const permissoesCarregadas = {};
        snapshot.forEach(doc => {
          permissoesCarregadas[doc.id] = doc.data().permissoes;
        });
        
        setPermissoesSalvas(permissoesCarregadas);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      }
    };

    carregarPermissoes();
  }, []);

  const handleCardClick = (role) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return newSet;
    });
  };

  const handlePermissaoChange = (role, categoria, permissao, valor) => {
    setPermissoesEditadas(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [categoria]: {
          ...prev[role]?.[categoria],
          [permissao]: valor
        }
      }
    }));
  };

  const handleSalvar = async (role) => {
    try {
      setStatus({ role, state: 'saving' });
      
      if (!permissoesEditadas[role]) {
        setMensagem({ tipo: 'info', texto: 'Nenhuma alteração para salvar.' });
        return;
      }

      const permissoesRef = collection(db, 'permissoes');
      const permissaoDoc = doc(permissoesRef, role.toLowerCase());
      const docSnap = await getDoc(permissaoDoc);

      const permissoesCompletas = permissoes[role].permissoes;

      let permissoesAtuais = docSnap.exists() 
        ? docSnap.data().permissoes 
        : permissoesCompletas;

      let permissoesAtualizadas = JSON.parse(JSON.stringify(permissoesAtuais));

      Object.entries(permissoesEditadas[role]).forEach(([categoria, valores]) => {
        if (categoria === 'menus') {
          permissoesAtualizadas.menus = {
            ...permissoesAtualizadas.menus,
            ...valores
          };
        } else {
          permissoesAtualizadas[categoria] = {
            ...permissoesAtualizadas[categoria],
            ...valores
          };
        }
      });

      const todosMenus = {
        inicio: permissoesAtualizadas.menus?.inicio ?? permissoesCompletas.menus.inicio,
        projetos: permissoesAtualizadas.menus?.projetos ?? permissoesCompletas.menus.projetos,
        colaboradores: permissoesAtualizadas.menus?.colaboradores ?? permissoesCompletas.menus.colaboradores,
        escalas: permissoesAtualizadas.menus?.escalas ?? permissoesCompletas.menus.escalas,
        tarefas: permissoesAtualizadas.menus?.tarefas ?? permissoesCompletas.menus.tarefas,
        usuarios: permissoesAtualizadas.menus?.usuarios ?? permissoesCompletas.menus.usuarios,
        permissoes: permissoesAtualizadas.menus?.permissoes ?? permissoesCompletas.menus.permissoes,
        perfil: permissoesAtualizadas.menus?.perfil ?? permissoesCompletas.menus.perfil
      };

      permissoesAtualizadas.menus = todosMenus;

      const permissoesData = {
        nome: permissoes[role].nome,
        descricao: permissoes[role].descricao,
        permissoes: permissoesAtualizadas,
        atualizadoEm: new Date().toISOString()
      };

      if (!docSnap.exists()) {
        await setDoc(permissaoDoc, {
          ...permissoesData,
          criadoEm: new Date().toISOString()
        });
      } else {
        await updateDoc(permissaoDoc, permissoesData);
      }

      setPermissoesSalvas(prev => ({
        ...prev,
        [role.toLowerCase()]: permissoesAtualizadas
      }));

      setPermissoesEditadas(prev => {
        const newSet = { ...prev };
        delete newSet[role];
        return newSet;
      });

      setMensagem({ tipo: 'sucesso', texto: 'Permissões atualizadas com sucesso!' });
      setStatus({ role, state: 'success' });
      
      setTimeout(() => {
        setStatus({ role: '', state: '' });
      }, 2000);

    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar as permissões. Tente novamente.' });
    } finally {
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
    }
  };

  const permissoes = {
    Administrador: {
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema com controle sobre usuários e permissões',
      icon: faUserShield,
      permissoes: {
        menus: {
          titulo: 'Acesso aos Menus',
          inicio: true,
          projetos: true,
          colaboradores: true,
          escalas: true,
          tarefas: true,
          usuarios: true,
          permissoes: true,
          perfil: true
        },
        projetos: {
          titulo: 'Projetos',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          gerenciarEquipe: true,
          definirPrazos: true
        },
        colaboradores: {
          titulo: 'Colaboradores',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          gerenciarFerias: true
        },
        escalas: {
          titulo: 'Escalas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true
        },
        tarefas: {
          titulo: 'Tarefas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          moverStatus: true,
          atribuirResponsavel: true
        },
        usuarios: {
          titulo: 'Usuários',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
          gerenciarPermissoes: true
        }
      }
    },
    Supervisor: {
      nome: 'Supervisor',
      descricao: 'Supervisiona projetos e equipes',
      icon: faShieldAlt,
      permissoes: {
        menus: {
          titulo: 'Acesso aos Menus',
          inicio: true,
          projetos: true,
          colaboradores: true,
          escalas: true,
          tarefas: true,
          usuarios: false,
          permissoes: false,
          perfil: true
        },
        projetos: {
          titulo: 'Projetos',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          gerenciarEquipe: true,
          definirPrazos: true
        },
        colaboradores: {
          titulo: 'Colaboradores',
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarFerias: true
        },
        escalas: {
          titulo: 'Escalas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false
        },
        tarefas: {
          titulo: 'Tarefas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          moverStatus: true,
          atribuirResponsavel: true
        },
        usuarios: {
          titulo: 'Usuários',
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarPermissoes: false
        }
      }
    },
    Analista: {
      nome: 'Analista',
      descricao: 'Responsável pela análise e documentação de projetos',
      icon: faKey,
      permissoes: {
        menus: {
          titulo: 'Acesso aos Menus',
          inicio: true,
          projetos: true,
          colaboradores: true,
          escalas: true,
          tarefas: true,
          usuarios: false,
          permissoes: false,
          perfil: true
        },
        projetos: {
          titulo: 'Projetos',
          visualizar: true,
          criar: false,
          editar: true,
          excluir: false,
          gerenciarEquipe: false,
          definirPrazos: true
        },
        colaboradores: {
          titulo: 'Colaboradores',
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarFerias: false
        },
        escalas: {
          titulo: 'Escalas',
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false
        },
        tarefas: {
          titulo: 'Tarefas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          moverStatus: true,
          atribuirResponsavel: false
        },
        usuarios: {
          titulo: 'Usuários',
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarPermissoes: false
        }
      }
    },
    Desenvolvedor: {
      nome: 'Desenvolvedor',
      descricao: 'Responsável pelo desenvolvimento técnico dos projetos',
      icon: faLock,
      permissoes: {
        menus: {
          titulo: 'Acesso aos Menus',
          inicio: true,
          projetos: true,
          colaboradores: true,
          escalas: true,
          tarefas: true,
          usuarios: false,
          permissoes: false,
          perfil: true
        },
        projetos: {
          titulo: 'Projetos',
          visualizar: true,
          criar: false,
          editar: true,
          excluir: false,
          gerenciarEquipe: false,
          definirPrazos: true
        },
        colaboradores: {
          titulo: 'Colaboradores',
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarFerias: false
        },
        escalas: {
          titulo: 'Escalas',
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false
        },
        tarefas: {
          titulo: 'Tarefas',
          visualizar: true,
          criar: true,
          editar: true,
          excluir: false,
          moverStatus: true,
          atribuirResponsavel: false
        },
        usuarios: {
          titulo: 'Usuários',
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          gerenciarPermissoes: false
        }
      }
    }
  };

  return (
    <div className="tarefas-container">
      <div className="tarefas-content">
        <div className="page-header">
          <h1 className="page-title">Permissões do Sistema</h1>
          {mensagem.texto && (
            <div className={`mensagem-feedback ${mensagem.tipo}`}>
              {mensagem.texto}
            </div>
          )}
        </div>

        <div className="permissoes-grid">
          {Object.entries(permissoes).map(([role, info]) => (
            <div key={role}>
              <div 
                className={`permissao-card ${expandedCards.has(role) ? 'expanded' : ''}`} 
                data-role={role}
                onClick={() => handleCardClick(role)}
              >
                <div className="permissao-header">
                  <div className="permissao-icon">
                    <FontAwesomeIcon icon={info.icon} />
                  </div>
                  <h2>{info.nome}</h2>
                  <span className="role-badge">{role}</span>
                  <FontAwesomeIcon 
                    icon={expandedCards.has(role) ? faChevronUp : faChevronDown} 
                    className="expand-icon"
                  />
                </div>
                <p className="permissao-descricao">{info.descricao}</p>
                <div className="permissoes-resumo">
                  <div className="resumo-item">
                    <span className="resumo-label">Menus Acessíveis:</span>
                    <span className="resumo-valor">
                      {Object.entries(info.permissoes.menus)
                        .filter(([key, value]) => key !== 'titulo' && value === true)
                        .length} menus
                    </span>
                  </div>
                  <div className="resumo-item">
                    <span className="resumo-label">Nível de Acesso:</span>
                    <span className="resumo-valor">
                      {role === 'Administrador' ? 'Total' : 
                       role === 'Supervisor' ? 'Gerencial' : 
                       'Restrito'}
                    </span>
                  </div>
                </div>
              </div>

              {expandedCards.has(role) && (
                <div className="permissoes-detalhadas">
                  <div className="detalhadas-header">
                    <h3>Permissões Detalhadas - {info.nome}</h3>
                  </div>
                  <div className="detalhadas-content">
                    {Object.entries(info.permissoes).map(([categoria, permissoes]) => (
                      <div key={categoria} className="permissao-categoria">
                        <h4 className="categoria-titulo">{permissoes.titulo}</h4>
                        <div className="categoria-permissoes">
                          {Object.entries(permissoes)
                            .filter(([key]) => key !== 'titulo')
                            .map(([key, value]) => (
                              <div key={key} className="permissao-toggle">
                                <label>
                                  <span className="permissao-nome">
                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <div className="toggle-switch">
                                    <input
                                      type="checkbox"
                                      checked={
                                        permissoesEditadas[role]?.[categoria]?.[key] ?? 
                                        permissoesSalvas[role.toLowerCase()]?.[categoria]?.[key] ?? 
                                        value
                                      }
                                      onChange={(e) => handlePermissaoChange(role, categoria, key, e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                  </div>
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                    <div className="detalhadas-actions">
                      <button 
                        className="cancel-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCards(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(role);
                            return newSet;
                          });
                          setPermissoesEditadas(prev => {
                            const newState = { ...prev };
                            delete newState[role];
                            return newState;
                          });
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Cancelar
                      </button>
                      <button 
                        className="save-btn"
                        onClick={() => handleSalvar(role)}
                        disabled={status.role === role || !permissoesEditadas[role]}
                      >
                        <FontAwesomeIcon 
                          icon={
                            status.role === role
                              ? status.state === 'saving'
                                ? faSpinner
                                : faCheckCircle
                              : faSave
                          }
                          className={
                            status.role === role && status.state === 'saving' 
                              ? 'fa-spin' 
                              : status.role === role && status.state === 'success'
                                ? 'success-icon'
                                : ''
                          }
                        />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Permissoes; 