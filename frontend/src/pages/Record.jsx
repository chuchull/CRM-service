import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../utils/auth';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../styles/record.css';

export default function Record() {
  const { module: moduleName, recordId } = useParams();
  const navigate = useNavigate();
  const crmToken = getToken();

  const [record, setRecord] = useState(null);
  const [relatedModules, setRelatedModules] = useState([]);
  const [relatedRecords, setRelatedRecords] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyFields, setShowEmptyFields] = useState(false);

  useEffect(() => {
    if (!crmToken || !recordId) return;
    fetchRecord();
  }, [crmToken, moduleName, recordId]);

  useEffect(() => {
    if (record) {
      fetchRelatedModules();
      fetchHistory();
    }
  }, [record]);

  useEffect(() => {
    if (relatedModules.length > 0) {
      fetchRelatedRecords();
    }
  }, [relatedModules]);

  const fetchRecord = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Record/${recordId}`,
        { headers: getHeaders() }
      );
      setRecord(response.data.result);
    } catch (error) {
      console.error('Ошибка загрузки записи:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedModules = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/RelatedModules`,
        { headers: getHeaders() }
      );
      setRelatedModules(Object.values(response.data.result.related || {}));
    } catch (error) {
      console.error('Ошибка загрузки связанных модулей:', error);
    }
  };

  const fetchRelatedRecords = async () => {
    try {
      const relatedData = {};
      for (const mod of relatedModules) {
        const response = await axios.get(
          `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/RecordRelatedList/${recordId}/${mod.relatedModuleName}`,
          { headers: getHeaders() }
        );
        const { headers, records } = response.data.result;
        relatedData[mod.relatedModuleName] = { headers, records };
      }
      setRelatedRecords(relatedData);
    } catch (error) {
      console.error('Ошибка загрузки связанных записей:', error);
    }
  };

  const fetchHistory = async () => {
    if (!recordId) return;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/RecordHistory/${recordId}`,
        { headers: getHeaders() }
      );
      setHistoryData(Object.values(response.data.result.records || {}));
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
    'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
    'X-TOKEN': crmToken,
  });

  const renderFieldValue = (key, value) => {
    if (!value || value === "") return "—"; // Пустое значение
    if (typeof value === "object") {
      if (value.value) {
        // Это reference (связанный объект)
        return (
          <a
            href={`/modules/${value.referenceModule}/record/${value.raw}`}
            className="record-link"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/modules/${value.referenceModule}/record/${value.raw}`);
            }}
          >
            {value.value}
          </a>
        );
      }
      return JSON.stringify(value, null, 2); // Показываем объект в JSON-формате
    }

    if (typeof value === "boolean") return value ? "✅ Да" : "❌ Нет";

    return value;
  };

  if (loading) return <p>Загрузка...</p>;

  if (!record) return <p>Запись не найдена</p>;

  // Разделение полей на заполненные и пустые
  const filledFields = Object.entries(record.fields).filter(([key]) => record.data[key] && record.data[key] !== "");
  const emptyFields = Object.entries(record.fields).filter(([key]) => !record.data[key] || record.data[key] === "");

  return (
    <div className="record-container">
      <h2>{moduleName} — ID {recordId}</h2>

      <Tabs>
        <TabList>
          <Tab>Карточка {moduleName}</Tab>
          {relatedModules.map(mod => (
            <Tab key={mod.relatedModuleName}>{mod.label}</Tab>
          ))}
          <Tab>История</Tab>
        </TabList>

        {/* Вкладка с основной информацией */}
        <TabPanel>
          <div className="record-details">
            <table className="record-table">
              <tbody>
                {filledFields.reduce((rows, [key, label], index, array) => {
                  if (index % 2 === 0) {
                    rows.push(array.slice(index, index + 2)); // Берем пары элементов
                  }
                  return rows;
                }, []).map((pair, rowIndex) => (
                  <tr key={rowIndex}>
                    {pair.map(([key, label]) => (
                      <React.Fragment key={key}>
                        <td className="record-label"><strong>{label}:</strong></td>
                        <td className="record-value">{renderFieldValue(key, record.data[key])}</td>
                      </React.Fragment>
                    ))}
                    {/* Если строка состоит из одного элемента, добавляем пустую ячейку */}
                    {pair.length === 1 && <><td></td><td></td></>}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Кнопка для показа скрытых полей */}
            {emptyFields.length > 0 && (
              <button onClick={() => setShowEmptyFields(!showEmptyFields)} className="show-empty-btn">
                {showEmptyFields ? "Скрыть пустые поля" : "Показать пустые поля"}
              </button>
            )}

            {/* Блок с пустыми полями */}
            {showEmptyFields && (
              <div className="empty-fields">
                <table className="record-table">
                  <tbody>
                    {emptyFields.reduce((rows, [key, label], index, array) => {
                      if (index % 2 === 0) {
                        rows.push(array.slice(index, index + 2));
                      }
                      return rows;
                    }, []).map((pair, rowIndex) => (
                      <tr key={rowIndex}>
                        {pair.map(([key, label]) => (
                          <React.Fragment key={key}>
                            <td className="record-label"><strong>{label}:</strong></td>
                            <td className="record-value">—</td>
                          </React.Fragment>
                        ))}
                        {pair.length === 1 && <><td></td><td></td></>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabPanel>
        {/* Вкладки с связанными модулями */}
        {relatedModules.map(mod => (
          <TabPanel key={mod.relatedModuleName}>
            {relatedRecords[mod.relatedModuleName] ? (
              <table>
                <thead>
                  <tr>
                    {Object.entries(relatedRecords[mod.relatedModuleName].headers).map(([key, label]) => (
                      <th key={key}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(relatedRecords[mod.relatedModuleName].records).map(([id, record]) => (
                    <tr key={id} onClick={() => navigate(`/modules/${mod.relatedModuleName}/record/${id}`)} style={{ cursor: 'pointer' }}>
                      {Object.entries(relatedRecords[mod.relatedModuleName].headers).map(([key]) => (
                        <td key={key}>{renderFieldValue(key, record[key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных</p>
            )}
          </TabPanel>
        ))}
          {/* Вкладка с историей */}
          <TabPanel>
            <div className="history-timeline">
              {historyData.length > 0 ? (
                historyData.map((item, index) => (
                  <div key={index} className="history-event">
                    <span className="history-time">{item.time}</span>
                    <strong className="history-owner">{item.owner}</strong>
                    <span className={`history-status ${item.status}`}>{item.status}</span>

                    {Object.entries(item.data).map(([key, change]) => (
                      <div key={key} className="history-change">
                        <strong>{change.label}:</strong>
                        {change.from && change.to ? (
                          <span className="history-change-value">{change.from} → {change.to}</span>
                        ) : (
                          <span className="history-new-value">{change.value || change.targetLabel}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p>Нет данных</p>
              )}
            </div>
          </TabPanel>
      </Tabs>
    </div>
  );
}
