import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

// Функция для проверки наличия токена
export const checkAuth = () => {
  const token = Cookies.get('token');
  return !!token;
};

// Хук для проверки аутентификации и перенаправления на страницу логина
export const useAuth = () => {
  const navigate = useNavigate();

  const isAuthenticated = checkAuth();
  if (!isAuthenticated) {
    navigate('/login');
  }

  return isAuthenticated;
};

export const logout = () => {
  Cookies.remove('token');
  Cookies.remove('api_key');
  Cookies.remove('authorization');
  Cookies.remove('description');
  Cookies.remove('secondary_phone');
  Cookies.remove('secondary_phone_extra');
  window.location.href = '/login';
};

// Функция для получения токена из куки
export const getToken = () => {
  return Cookies.get('token');
};