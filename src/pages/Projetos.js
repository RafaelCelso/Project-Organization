import { usePermissions } from '../hooks/usePermissions';

function Projetos() {
  const { can } = usePermissions();

  // ... código existente ...

  return (
    <div className="projects-page-container">
      <div className="projects-header">
        <h1>Projetos</h1>
        {can('create') && (
          <button onClick={handleNewProject}>
            <FontAwesomeIcon icon={faPlus} />
            Novo Projeto
          </button>
        )}
      </div>

      {/* ... resto do código ... */}

      {projeto.map(projeto => (
        <div key={projeto.id}>
          {/* ... código do projeto ... */}
          {can('update') && (
            <button onClick={() => handleEdit(projeto)}>Editar</button>
          )}
          {can('delete') && (
            <button onClick={() => handleDelete(projeto)}>Excluir</button>
          )}
        </div>
      ))}
    </div>
  );
} 