import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PSBlock from './PSBlock';
import '../index.css';

function RecordsTable({ recordsData }) {
  const { headers, records } = recordsData.result;
  // headers – объект, ключи которого соответствуют полям (id, и т.д.)
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          {Object.values(headers).map((headerName, index) => (
            <th key={index}>{headerName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(records).map(([id, row]) => (
          <tr key={id}>
            <td>{id}</td>
            {Object.keys(headers).map((fieldKey, index) => (
              <td key={index}>{row[fieldKey]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Layout() {
  const [recordsData, setRecordsData] = useState(null);
  const [selectedModuleKey, setSelectedModuleKey] = useState('');

  // Единая функция запроса записей для выбранного модуля
  const handleModuleSelect = async (moduleKey) => {
    const crmToken = localStorage.getItem('crmToken');
    try {
      const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleKey}/RecordsList`;
      const response = await axios.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
          'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
          'X-TOKEN': crmToken
        }
      });
      setRecordsData(response.data);
      setSelectedModuleKey(moduleKey);
    } catch (err) {
      console.error(err);
      alert('Error fetching records for module ' + moduleKey);
    }
  };

  return (
    <div className="main-con">
      {/* Левый столбец – Sidebar на всю высоту */}
      <div className="left-con">
        <Sidebar onSelectModule={handleModuleSelect} />
      </div>

      {/* Правый столбец – основной контент */}
      <div className="right-con">
        <Navbar />
        <div className="layout-body">
          <div className="layout-content">
            {recordsData ? (
              <>
                <h3>Records for module: {selectedModuleKey}</h3>
                <RecordsTable recordsData={recordsData} />
              </>
            ) : (
              <Outlet />
            )}
          </div>
          <PSBlock />
        </div> 
      </div>
    </div>
  );
}