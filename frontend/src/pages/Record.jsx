import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Record() {
  const { module: moduleName, recordId } = useParams();
  const [recordData, setRecordData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const crmToken = localStorage.getItem('crmToken');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecord = async () => {
      if (!crmToken) return;
      try {
        const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`;
        const response = await axios.get(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
            'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
            'X-TOKEN': crmToken
          }
        });
        // response.data.result содержит данные записи
        setRecordData(response.data.result);
        setFormData(response.data.result.data);
      } catch (err) {
        console.error('Error fetching record:', err);
        alert('Ошибка получения данных записи');
      }
    };

    fetchRecord();
  }, [crmToken, moduleName, recordId]);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpdate = async () => {
    try {
      const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`;
      const response = await axios.put(endpoint, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
          'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
          'X-TOKEN': crmToken
        }
      });
      setRecordData(response.data.result);
      setEditMode(false);
      alert('Запись обновлена');
    } catch (err) {
      console.error('Update error:', err);
      alert('Ошибка обновления записи');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`;
      await axios.delete(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
          'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
          'X-TOKEN': crmToken
        }
      });
      alert('Запись удалена');
      navigate(`/modules/${moduleName}`);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Ошибка удаления записи');
    }
  };

  return (
    <div>
      <h2>
        Запись для модуля {moduleName} — ID {recordId}
      </h2>
      {recordData ? (
        <div>
          <div>
            <h3>{recordData.name}</h3>
            <p>ID: {recordData.id}</p>
          </div>
          <div>
            <h4>Поля</h4>
            <ul>
              {recordData.fields &&
                Object.entries(recordData.fields).map(([key, label]) => (
                  <li key={key}>
                    <strong>{label}:</strong>{' '}
                    {editMode ? (
                      <input
                        type="text"
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      recordData.data[key]
                    )}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            {editMode ? (
              <>
                <button onClick={handleUpdate}>Сохранить</button>
                <button onClick={() => setEditMode(false)}>Отмена</button>
              </>
            ) : (
              <>
                {recordData.privileges?.isEditable && (
                  <button onClick={() => setEditMode(true)}>Редактировать</button>
                )}
                {recordData.privileges?.moveToTrash && (
                  <button onClick={handleDelete}>Удалить</button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p>Загрузка записи...</p>
      )}
    </div>
  );
}