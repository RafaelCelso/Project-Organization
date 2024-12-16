export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const isAuthenticated = () => {
  const token = getToken();
  // Adicione lógica para verificar se o token é válido
  return !!token; // Retorna true se o token existir
};