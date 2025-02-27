import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../utils/auth';

export default function Modules() {
  const { moduleId } = useParams();
  const location = useLocation();
  const moduleName = location.state?.moduleName || moduleId;
  const [recordsData, setRecordsData] = useState(null);
  const crmToken = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!crmToken || !moduleId) return;
      try {
        const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleId}/RecordsList`;
        const response = await axios.get(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
            'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
            'X-TOKEN': crmToken
          }
        });
        setRecordsData(response.data);
      } catch (err) {
        console.error(err);
        alert('Ошибка при получении записей для модуля ' + moduleId);
      }
    };

    fetchRecords();
  }, [crmToken, moduleId]);

  return (
    <div>
      <h2>Модуль: {moduleName}</h2>
      {recordsData ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {recordsData.result.headers &&
                Object.values(recordsData.result.headers).map((headerName, index) => (
                  <th key={index}>{headerName}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {recordsData.result.records &&
              Object.entries(recordsData.result.records).map(([id, row]) => (
                <tr 
                  key={id}
                  onClick={() => navigate(`/modules/${moduleId}/record/${id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{id}</td>
                  {recordsData.result.headers &&
                    Object.keys(recordsData.result.headers).map((fieldKey, index) => (
                      <td key={index}>{row[fieldKey]}</td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p>Загрузка данных модуля...</p>
      )}
    </div>
  );
}