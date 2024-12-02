import { usePermissions } from '../hooks/usePermissions';

function Projetos() {
  const { can } = usePermissions();

  return (
    <div className="projetos-container">
      <div className="projetos-header">
        <h1>Projetos</h1>
        {can('criar', 'projetos') && (
          <button onClick={handleNewProject}>
            Novo Projeto
          </button>
        )}
      </div>

      {projetos.map(projeto => (
        <div key={projeto.id}>
          <h3>{projeto.nome}</h3>
          {can('editar', 'projetos') && (
            <button onClick={() => handleEdit(projeto)}>Editar</button>
          )}
          {can('excluir', 'projetos') && (
            <button onClick={() => handleDelete(projeto)}>Excluir</button>
          )}
        </div>
      ))}
    </div>
  );
} 