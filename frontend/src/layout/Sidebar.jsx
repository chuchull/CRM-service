import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

export default function Sidebar() {
  const [modules, setModules] = useState([]);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const crmToken = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      if (!crmToken) return;
  
      try {
        const response = await axios.get('http://localhost:8080/api/crm/modules', {
          headers: { 'X-TOKEN': crmToken }
        });
  
        if (response.data?.modules && typeof response.data.modules === 'object') {
          const entries = Object.entries(response.data.modules);
  
          // Проверим каждый модуль
          const validatedModules = await Promise.all(
            entries.map(async ([key, value]) => {
              try {
                const checkResponse = await axios.get(
                  `http://127.0.0.1:8000/webservice/WebserviceStandard/${key}/RecordsList`,
                  {
                    headers: {
                      'X-TOKEN': crmToken,
                      'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
                      'Content-Type': 'application/json',
                      'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
                      'x-row-limit': '1',
                    },
                    validateStatus: function (status) {
                      return status < 500; // не бросать исключение при 502
                    },
                  }
                );
  
                if (checkResponse.status === 502) {
                  return null;
                }
  
                return [key, value];
              } catch (e) {
                return null; // В случае ошибки тоже исключаем
              }
            })
          );
  
          // Удаляем null
          setModules(validatedModules.filter(Boolean));
        } else {
          setModules([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке модулей:', err);
        alert('Ошибка при загрузке модулей');
      }
    };
  
    fetchModules();
  }, [crmToken]);
  
  const handleToggleModules = () => {
    setIsModulesOpen((prev) => !prev);
  };

  const handleModuleClick = (moduleKey, moduleName) => {
    navigate(`/modules/${moduleKey}`, { state: { moduleName } });
  };

  return (
    <div className={`sidebar ${isModulesOpen ? 'open-status' : ''}`}>
      <div className="logo-container">
        <Link to="/home">
          <img src="/Logo.svg" alt="Логотип" />
        </Link>
        <h3>Колл-Центр</h3>
      </div>
      <div className="accordion">
        <div className="accordion-item">
          <div
            className={`accordion-header ${isModulesOpen ? 'active' : ''}`}
            onClick={handleToggleModules}
          >
            <img src="/modules.svg" alt="" />
            <span>Модули</span>
          </div>
          {isModulesOpen && (
            <div className="accordion-content">
              {modules.length > 0 ? (
                modules.map(([key, value]) => (
                  <div
                    key={key}
                    className="module-item"
                    onClick={() => handleModuleClick(key, value)}
                  >
                    {value}
                  </div>
                ))
              ) : (
                <p>Модули не найдены</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
