import axios from 'axios';
import { API_BASE_URL } from '../config';

// Configuração global do axios
axios.defaults.baseURL = API_BASE_URL;

// Adiciona o token de autenticação em todas as requisições
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axios; 