import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar usuário logado ao carregar a aplicação
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          console.error('Erro ao obter usuário atual:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, [token]);

  // Login
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setUser(user);
      
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(access_token);
      setUser(user);
      
      return true;
    } catch (err) {
      console.error('Erro no registro:', err);
      setError(err.response?.data?.message || 'Erro ao registrar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    
    try {
      if (token) {
        await authService.logout();
      }
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  // Verificar se o usuário é admin
  const isAdmin = () => {
    // Temporariamente retornando true para desenvolvimento
    // TODO: Implementar verificação correta depois de adicionar campo role ao banco de dados
    return true; // Originalmente: return user && user.role === 'admin';
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);