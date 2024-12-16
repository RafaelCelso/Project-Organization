import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "./firebaseConfig";
import "./Login.css";
import logo from "./logo.png";
import { setToken } from './services/auth';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const auth = getAuth();

      // Fazer login no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      // Buscar dados adicionais do usuário no Firestore
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("authUid", "==", userCredential.user.uid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Dados do usuário não encontrados");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verifica se o usuário está ativo
      if (userData.status === "Inativo") {
        await auth.signOut(); // Faz logout se usuário estiver inativo
        throw new Error(
          "Usuário inativo. Entre em contato com o administrador."
        );
      }

      // Salva os dados do usuário no localStorage
      const userInfo = {
        id: userDoc.id,
        nome: userData.nome,
        email: userData.email,
        cargo: userData.cargo,
        colaboradorId: userData.colaboradorId,
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      setToken(userCredential.user.accessToken); // Salva o token de autenticação

      // Redireciona para a página inicial
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer login:", error);

      // Tratamento de erros específicos do Firebase Auth
      let errorMessage = "Erro ao fazer login. Tente novamente.";

      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "E-mail ou senha incorretos.";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "Muitas tentativas de login. Tente novamente mais tarde.";
          break;
        default:
          errorMessage = "Erro ao fazer login. Tente novamente.";
      }

      setError(errorMessage);
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

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
