// src/pages/Modules.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Modules() {
  const [modules, setModules] = useState([]);
  const crmToken = localStorage.getItem('crmToken');

  const fetchModules = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/crm/modules', {
        headers: {
          'X-TOKEN': crmToken
        }
      });

      if (response.data && response.data.modules) {
      // Преобразуем объект в массив массивов [[key, value], [key, value], ...]
      const modulesArray = Object.entries(response.data.modules);
      setModules(modulesArray);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching modules');
    }
  };

  return (
    <div>
      <h2>Home Page</h2>
      <h3>Available Modules:</h3>
      <ul>
        {modules.length ? (
          modules.map((module, index) => <li key={index}>{module}</li>)
        ) : (
          <li>No modules available</li>
        )}
      </ul>
    </div>
  );
}