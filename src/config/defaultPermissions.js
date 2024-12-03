export const DEFAULT_PERMISSIONS = {
  Administrador: {
    menus: {
      inicio: true,
      projetos: true,
      colaboradores: true,
      escalas: true,
      tarefas: true,
      usuarios: true,
      permissoes: true,
      perfil: true
    },
    permissoes: {
      projetos: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true
      },
      usuarios: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true
      },
      permissoes: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: true
      }
    }
  },
  Desenvolvedor: {
    menus: {
      inicio: true,
      projetos: false,
      colaboradores: true,
      escalas: true,
      tarefas: true,
      usuarios: false,
      permissoes: false,
      perfil: true
    },
    permissoes: {
      projetos: {
        criar: false,
        definirPrazos: true,
        editar: true,
        excluir: false,
        gerenciarEquipe: false
      },
      usuarios: {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false
      },
      permissoes: {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false
      }
    }
  }
  // Adicione outras roles conforme necessário
}; 