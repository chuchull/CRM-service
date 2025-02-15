import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sidebar() {
  const [modules, setModules] = useState([]);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const crmToken = localStorage.getItem('crmToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      if (!crmToken) return;

      try {
        const response = await axios.get('http://localhost:8080/api/crm/modules', {
          headers: { 'X-TOKEN': crmToken }
        });

        if (response.data?.modules && typeof response.data.modules === 'object') {
          setModules(Object.entries(response.data.modules));
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

  const handleModuleClick = (moduleKey) => {
    navigate(`/modules/${moduleKey}`);
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
                    key={key}
                    className="module-item"
                    onClick={() => handleModuleClick(key)}
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
