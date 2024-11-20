import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './Login.css';
import logo from './logo.png';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError(''); // Limpa mensagens de erro quando o usuário começa a digitar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Busca o usuário pelo email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Usuário não encontrado');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verifica se o usuário está ativo
      if (userData.status === 'Inativo') {
        setError('Usuário inativo. Entre em contato com o administrador.');
        return;
      }

      // Verifica a senha
      if (userData.senha === formData.senha) { // Em produção, use comparação de hash
        // Salva os dados do usuário no localStorage
        const userInfo = {
          id: userDoc.id,
          nome: userData.nome,
          email: userData.email,
          cargo: userData.cargo,
          colaboradorId: userData.colaboradorId
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // Redireciona para a página inicial
        navigate('/');
      } else {
        setError('Senha incorreta');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Logo" className="login-logo" />
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;