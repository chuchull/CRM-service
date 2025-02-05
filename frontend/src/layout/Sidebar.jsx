import { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/sidebar.css';

export default function Sidebar({ onSelectModule }) {
  const [modules, setModules] = useState([]);
  const crmToken = localStorage.getItem('crmToken');

  useEffect(() => {
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
        alert('Error fetching modules');
      }
    };

    if (crmToken) {
      fetchModules();
    }
  }, [crmToken]);

  return (
    <div className="sidebar">
      <h3>Modules</h3>
      <ul>
        {modules.length ? (
          modules.map(([key, value], index) => (
            <li key={index}>
              <button className="sidebar-button" onClick={() => onSelectModule(key)}>
                {value}
              </button>
            </li>
          ))
        ) : (
          <li>No modules available</li>
        )}
      </ul>
    </div>
  );
}