import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
      if (response.data.result.token) {
        localStorage.setItem('crmToken', response.data.result.token);
        navigate('/home');
      }
    } catch (err) {
      setError('Invalid credentials');
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
            <button className='form-button-button' type="submit">O</button>
          </div>
        </form>
      </div>
  );
}