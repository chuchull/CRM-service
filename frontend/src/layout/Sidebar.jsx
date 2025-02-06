import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sidebar({ onSelectModule }) {
  const [modules, setModules] = useState([]);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const crmToken = localStorage.getItem('crmToken');

  useEffect(() => {
    const fetchModules = async () => {
      if (!crmToken) return; // Если нет токена, запрос не выполняем.

      try {
        const response = await axios.get('http://localhost:8080/api/crm/modules', {
          headers: { 'X-TOKEN': crmToken }
        });

        if (response.data?.modules && typeof response.data.modules === 'object') {
          setModules(Object.entries(response.data.modules));
        } else {
          setModules([]); // Если сервер вернул пустой объект или неверный формат.
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

  return (
    <div className={`sidebar ${isModulesOpen ? 'open-status' : ''}`}>
      <div className="logo-container">
      <Link to="/home">
      <img src="../../Logo.svg" alt="Logo" />
      </Link>
      <h3>Call-Center</h3>
      </div>
      <div className="accordion">
        <div className="accordion-item">
          <div
            className={`accordion-header ${isModulesOpen ? 'active' : ''}`}
            onClick={handleToggleModules}
          >
            <img src="../modules.svg" alt="" />
            <span>Modules</span>
            </div>
          {isModulesOpen && (
            <div className="accordion-content">
              {modules.length > 0 ? (
                modules.map(([key, value]) => (
                  <div
                    key={key} // Теперь key — это ID модуля, а не index.
                    className="module-item"
                    onClick={() => onSelectModule(key)}
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
