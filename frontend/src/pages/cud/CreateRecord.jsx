import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../../utils/auth';

// Компонент модального окна для выбора записи из справочного модуля
const ReferenceModal = ({ referenceModule, crmToken, onSelect, onClose }) => {
  const [recordsData, setRecordsData] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const endpoint = `http://127.0.0.1:8000/webservice/WebserviceStandard/${referenceModule}/RecordsList`;
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
        alert('Ошибка при получении записей для модуля ' + referenceModule);
      }
    };

    fetchRecords();
  }, [referenceModule, crmToken]);

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
        justifyContent: 'center', alignItems: 'center' 
      }}
    >
      <div 
        className="modal-content" 
        style={{ backgroundColor: 'white', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <button onClick={onClose}>Закрыть</button>
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
                    onClick={() => {
                      onSelect(id, row);
                      onClose();
                    }}
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
          <p>Загрузка данных...</p>
        )}
      </div>
    </div>
  );
};

const CreateRecord = () => {
  const { module: moduleName } = useParams();
  const navigate = useNavigate();
  const crmToken = getToken();
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  // Состояние для хранения информации о поле, для которого открыт выбор справочной записи
  const [openReferenceField, setOpenReferenceField] = useState(null);

  useEffect(() => {
    if (!crmToken) return;
    fetchFields();
  }, [crmToken, moduleName]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
    'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
    'X-TOKEN': crmToken,
  });

  const fetchFields = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Fields`,
        { headers: getHeaders() }
      );
      setFields(Object.values(response.data.result.fields || {}));
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки полей:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Преобразуем данные: если значение поля является объектом с id,
    // заменяем его на само id
    const payload = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && value.id) {
        payload[key] = value.id;
      } else {
        payload[key] = value;
      }
    });
  
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record`,
        payload,
        { headers: getHeaders() }
      );
      console.log('Запись создана:', response.data);
      navigate(`/modules/${moduleName}/record/${response.data.result.id}`);
    } catch (error) {
      console.error('Ошибка создания записи:', error);
    }
  };
  
  // Функция для рендера поля в зависимости от типа
  const renderField = (field) => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={formData[field.name] || false}
            onChange={handleChange}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          />
        );
      case 'tree': {
        const treeOptions = field.treeValues ? Object.values(field.treeValues) : [];
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          >
            <option value="">Выберите...</option>
            {treeOptions.map((option) => {
              const indent = option.parent !== '#' ? '\u00A0\u00A0\u00A0' : '';
              return (
                <option key={option.id} value={option.tree}>
                  {indent}{option.text}
                </option>
              );
            })}
          </select>
        );
      }
      case 'picklist':
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          >
            <option value="">Выберите...</option>
            {field.picklistvalues &&
              Object.entries(field.picklistvalues).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
          </select>
        );
      case 'reference': {
        // Предполагаем, что referenceList содержит один модуль, например "Contacts"
        const referenceModule = field.referenceList ? Object.values(field.referenceList)[0] : '';
        return (
          <div>
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={formData[field.name]?.display || ''}
              readOnly
              placeholder="Выберите запись"
            />
            <button
              type="button"
              onClick={() =>
                setOpenReferenceField({
                  fieldName: field.name,
                  referenceModule,
                })
              }
            >
              Выбрать
            </button>
          </div>
        );
      }
      case 'recordNumber':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            readOnly
          />
        );
      case 'owner':
      case 'userCreator':
      case 'sharedOwner':
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          >
            <option value="">Выберите...</option>
            {field.picklistvalues &&
              Object.entries(field.picklistvalues.Пользователи || {}).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleChange}
          />
        );
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="create-record-container">
      <h2>Создание записи в модуле {moduleName}</h2>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name}>{field.label}</label>
            {renderField(field)}
          </div>
        ))}
        <button type="submit">Сохранить</button>
      </form>
      {openReferenceField && (
        <ReferenceModal
          referenceModule={openReferenceField.referenceModule}
          crmToken={crmToken}
          onSelect={(id, record) => {
            // Сохраняем выбранное значение (id) и отображаемый текст (например, record.name)
            setFormData((prevData) => ({
              ...prevData,
              [openReferenceField.fieldName]: { id, display: record.name || id },
            }));
          }}
          onClose={() => setOpenReferenceField(null)}
        />
      )}
    </div>
  );
};

export default CreateRecord;
