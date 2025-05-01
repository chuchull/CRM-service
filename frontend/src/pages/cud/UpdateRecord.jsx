import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';

export default function UpdateRecord() {
  const { module: moduleName, recordId } = useParams();
  const navigate = useNavigate();
  const crmToken = getToken();

  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [openReferenceField, setOpenReferenceField] = useState(null);

  const [blocks, setBlocks] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [originalData, setOriginalData] = useState({});



  useEffect(() => {
    if (!crmToken || !recordId) return;
    fetchStructure();
    fetchRecord();
  }, [crmToken, moduleName, recordId]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
    'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
    'X-TOKEN': crmToken,
  });

  const fetchStructure = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Fields`,
        {
          headers: {
            ...getHeaders(),
            'x-response-params': '["blocks"]'
          }
        }
      );
  
      const fieldList = Object.values(response.data.result.fields || {});
      const blocksData = response.data.result.blocks || {};
  
      setFields(fieldList);
      setBlocks(blocksData);
  
      // Инициализируем сворачивание всех блоков
      const expanded = {};
      Object.keys(blocksData).forEach(blockId => {
        const blockName = blocksData[blockId].label || 'Другие поля';
        expanded[blockName] = false;
      });
      setExpandedBlocks(expanded);
  
    } catch (error) {
      console.error('Ошибка загрузки структуры полей:', error);
    }
  };
  
  const groupFieldsByBlocks = () => {
    const grouped = {};
  
    fields.forEach((field) => {
      const blockId = field.blockId;
      const blockName = blocks[blockId]?.name || 'Другие поля';
  
      if (!grouped[blockName]) {
        grouped[blockName] = [];
      }
      grouped[blockName].push(field);
    });
  
    return grouped;
  };
  

  const fetchRecord = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`,
        { headers: getHeaders() }
      );
      const data = response.data.result.data;
      setFormData(data);
      setOriginalData(data); // ← сохранили исходное состояние
    } catch (error) {
      console.error('Ошибка загрузки записи:', error);
    } finally {
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

  const renderField = (field) => {
    const currentValue = formData[field.name];

    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={currentValue || ''}
            onChange={handleChange}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={currentValue || false}
            onChange={handleChange}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={currentValue ? currentValue.substring(0,16) : ''}
            onChange={handleChange}
          />
        );
      case 'picklist':
        return (
          <select
            id={field.name}
            name={field.name}
            // value={currentValue || ''}
            onChange={handleChange}
          >
            <option value="">Выберите...</option>
            {field.picklistvalues && Object.entries(field.picklistvalues).map(([key, val]) => (
              <option key={key} value={key} selected={val === currentValue}>
                {val}
              </option>
            ))}
          </select>
        );
      case 'owner':
        return (
        <select
          id={field.name}
          name={field.name}
          onChange={handleChange}
        >
          <option value="">Выберите...</option>

          {field.picklistvalues &&
            Object.entries(field.picklistvalues).map(([groupLabel, options]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {Object.entries(options).map(([key, val]) => (
                  <option
                    key={key}
                    value={key}
                    selected={val.split(' (')[0] === currentValue}
                  >
                    {val}
                  </option>

                ))}
              </optgroup>
            ))}
        </select>


        );
      case 'reference': {
        const referenceModule = field.referenceList ? Object.values(field.referenceList)[0] : '';
        return (
          <div>
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={currentValue?.display || ''}
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
      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={currentValue || ''}
            onChange={handleChange}
          />
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {};
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = originalData[key];
  
      const normalize = (val) => {
        if (typeof val === 'object' && val !== null && val.id) return val.id;
        if (typeof val === 'boolean') return val ? '1' : '0';
        return val ?? '';
      };
  
      const newVal = normalize(value);
      const oldVal = normalize(originalValue);
  
      if (newVal !== oldVal) {
        payload[key] = newVal;
      }
    });
  
    console.log('Изменённые поля для отправки:', payload);
  
    if (Object.keys(payload).length === 0) {
      alert('Нет изменений для сохранения');
      return;
    }
  
    try {
      await axios.put(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`,
        payload,
        { headers: getHeaders() }
      );
      navigate(`/modules/${moduleName}/record/${recordId}`);
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      alert('Ошибка при обновлении записи');
    }
  };
  
  

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="update-record-container">
      <h2>Редактирование записи в модуле {moduleName}</h2>
      <form onSubmit={handleSubmit}>
      {Object.entries(groupFieldsByBlocks()).map(([blockName, blockFields]) => (
        <div key={blockName} className="block-section" style={{ marginBottom: '20px' }}>
          <h3
            onClick={() =>
              setExpandedBlocks(prev => ({
                ...prev,
                [blockName]: !prev[blockName],
              }))
            }
            style={{ cursor: 'pointer' }}
          >
            {expandedBlocks[blockName] ? '▼' : '►'} {blockName}
          </h3>

          {expandedBlocks[blockName] && (
            <div className="block-fields">
              {blockFields.map((field) => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
        <button type="submit">Сохранить изменения</button>
      </form>

      {openReferenceField && (
        <ReferenceModal
          referenceModule={openReferenceField.referenceModule}
          crmToken={crmToken}
          onSelect={(id, record) => {
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
}

// ReferenceModal прямо внутри компонента UpdateRecord (как в CreateRecord)
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
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button onClick={onClose}>Закрыть</button>
        {recordsData ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {recordsData.result.headers && Object.values(recordsData.result.headers).map((headerName, index) => (
                  <th key={index}>{headerName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recordsData.result.records && Object.entries(recordsData.result.records).map(([id, row]) => (
                <tr key={id} onClick={() => { onSelect(id, row); onClose(); }} style={{ cursor: 'pointer' }}>
                  <td>{id}</td>
                  {recordsData.result.headers && Object.keys(recordsData.result.headers).map((fieldKey, index) => (
                    <td key={index}>{row[fieldKey]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<p>Загрузка данных...</p>)}
      </div>
    </div>
  );
};
