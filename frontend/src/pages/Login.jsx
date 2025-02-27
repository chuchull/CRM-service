import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';


export default function Login() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        username,
        password
      });

      const { api_key, authorization, description, email, first_name, last_name, secondary_phone, secondary_phone_extra, token } = response.data;

      // Сохраняем данные в сессионные куки
      Cookies.set('api_key', api_key, { expires: 1 });
      Cookies.set('authorization', authorization, { expires: 1 });
      Cookies.set('description', description, { expires: 1 });
      Cookies.set('secondary_phone', secondary_phone, { expires: 1 });
      Cookies.set('secondary_phone_extra', secondary_phone_extra, { expires: 1 });
      Cookies.set('token', token, { expires: 1 });

      // Перенаправляем на домашнюю страницу
      navigate('/home');
    } catch (err) {
      setError('Неверные данные');
    }
  };

  return (
    <div className="login-body">
      <div className="login-logo-container">
        <img 
          src="../Logo.svg"  
          alt="Logo"
          className="login-logo-svg" 
        />
      </div>
        {error && <div className="error">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="field">
              <label>Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-button">
            <button className='form-button-button' type="submit">
            <img 
              src="../login.svg"  
              alt="Logo"
              className="" 
            />
            </button>
          </div>
        </form>
      </div>
  );
}