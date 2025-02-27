// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, getToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  useAuth(); // Проверка аутентификации

  const [modules, setModules] = useState([]);
  const crmToken = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!crmToken) {
      window.location.href = '/login';
    } else {
      fetchModules();
    }
  }, [crmToken]);

  const fetchModules = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/crm/modules', {
        headers: {
          'X-TOKEN': crmToken
        }
      });

      if (response.data && response.data.modules) {
        const modulesArray = Object.entries(response.data.modules);
        setModules(modulesArray);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при получении модулей');
    }
  };

  return (
    <div>
      <h2>Главная страница</h2>
      <h3>Доступные модули:</h3>
      <ul>
        {modules.length ? (
          modules.map(([key, value], index) => (
            <li key={index} onClick={() => navigate(`/modules/${key}`, { state: { moduleName: value } })} style={{ cursor: 'pointer' }}>
              {value}
            </li>
          ))
        ) : (
          <li>Нет доступных модулей</li>
        )}
      </ul>
    </div>
  );
}