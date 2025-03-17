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

  // Состояния для данных записи, структуры и объединённого результата
  const [record, setRecord] = useState(null);
  const [structure, setStructure] = useState(null);
  const [mergedRecord, setMergedRecord] = useState(null);

  // Состояния для связанных модулей, связанных записей и истории
  const [relatedModules, setRelatedModules] = useState([]);
  const [relatedRecords, setRelatedRecords] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyFields, setShowEmptyFields] = useState(false);
  // Состояние для сворачивания/разворачивания блоков
  const [expandedBlocks, setExpandedBlocks] = useState({});

  // Загружаем запись и её структуру
  useEffect(() => {
    if (!crmToken || !recordId) return;
    fetchRecord();
    fetchStructure();
  }, [crmToken, moduleName, recordId]);

  // После загрузки записи запускаем запросы для связанных данных
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

  // Как только и запись, и структура получены – объединяем их
  useEffect(() => {
    if (record && structure) {
      const merged = mergeRecordAndStructure(record, structure);
      setMergedRecord(merged);
    }
  }, [record, structure]);

  // Инициализация состояния сворачивания блоков после получения mergedRecord
  useEffect(() => {
    if (mergedRecord) {
      const newExpanded = {};
      Object.keys(mergedRecord).forEach(blockName => {
        const block = mergedRecord[blockName];
        // Определяем, есть ли хотя бы одно непустое поле
        const hasData = block.fields.some(field => field.value && field.value !== "");
        newExpanded[blockName] = hasData; // если есть данные – развернут, иначе свернут
      });
      setExpandedBlocks(newExpanded);
    }
  }, [mergedRecord]);

  // Запрос для получения данных записи
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

  // Запрос для получения структуры записи (поля, блоки, селекторы и т.д.)
  const fetchStructure = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/Fields`,
        { headers: getHeadersFields() }
      );
      setStructure(response.data.result);
    } catch (error) {
      console.error('Ошибка загрузки структуры записи:', error);
    }
  };

  // Запрос связанных модулей
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

  // Запрос связанных записей для каждого из модулей
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

  // Запрос истории записи
  const fetchHistory = async () => {
    if (!recordId) return;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/webservice/WebserviceStandard/${moduleName}/RecordHistory/${recordId}`,
        { headers: getHeaders() }
      );
      setHistoryData(Object.values(response.data.result.records || {}).reverse());
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  };

  // Заголовки для запросов
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
    'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
    'X-TOKEN': crmToken,
  });

  const getHeadersFields = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Basic dGVzdDoxMjM0NTY3ODk=',
    'x-api-key': 'ruh3aB5uVDwwQNKkCV83RTqX8Wfwxtc5',
    'X-TOKEN': crmToken,
    'X-ENCRYPTED': '1',
    'x-response-params': '["blocks"]',
  });

  // Функция для объединения данных записи и структуры, сгруппированная по блокам
  const mergeRecordAndStructure = (record, structureData) => {
    const fieldDefs = structureData?.fields;
    const blocks = structureData?.blocks;

    if (!fieldDefs || !blocks) {
      console.error("Неверная структура: отсутствуют поля или блоки", structureData);
      return {};
    }

    const mergedData = {};

    // Инициализируем объект для каждого блока
    Object.keys(blocks).forEach((blockId) => {
      const block = blocks[blockId];
      mergedData[block.name] = {
        label: block.label,
        fields: [],
      };
    });

    // Распределяем поля по блокам
    Object.entries(fieldDefs).forEach(([fieldName, fieldDef]) => {
      const blockId = fieldDef.blockId;
      const block = blocks[blockId];
      const fieldValue = record.data[fieldName] || "";

      if (block) {
        mergedData[block.name].fields.push({
          name: fieldName,
          label: fieldDef.label,
          value: fieldValue,
          definition: fieldDef,
        });
      } else {
        // Если для поля не найден блок, добавляем в группу "Other"
        if (!mergedData["Other"]) {
          mergedData["Other"] = { label: "Other", fields: [] };
        }
        mergedData["Other"].fields.push({
          name: fieldName,
          label: fieldDef.label,
          value: fieldValue,
          definition: fieldDef,
        });
      }
    });

    return mergedData;
  };

  // Функция для рендеринга значения поля с учётом его типа и возможных ссылок
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
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "boolean") return value ? "✅ Да" : "❌ Нет";
    return value;
  };

  // Если данные ещё не загружены, отображаем загрузку
  if (loading || !record || !structure || !mergedRecord) return <p>Загрузка...</p>;

  // Сортируем блоки: сначала те, у которых есть непустые поля, затем пустые
  const sortedBlocks = Object.entries(mergedRecord).sort(
    ([nameA, blockA], [nameB, blockB]) => {
      const hasDataA = blockA.fields.some(field => field.value && field.value !== "");
      const hasDataB = blockB.fields.some(field => field.value && field.value !== "");
      if (hasDataA === hasDataB) return 0;
      return hasDataA ? -1 : 1;
    }
  );

  // Обработчик переключения состояния блока (свернуть/развернуть)
  const toggleBlock = (blockName) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockName]: !prev[blockName],
    }));
  };
  const getLabel = (key) => {
    switch (key) {
      case 'targetModule':
        return 'Системное имя модуля';
      case 'targetModuleLabel':
        return 'Модуль';
      case 'targetLabel':
        return 'Название';
      default:
        return key; // или любое другое значение по умолчанию
    }
  };
  

  return (
    <div className="record-container">
      <h2>{record.name} — ID {recordId}</h2>
      <h3>{record.fields.assigned_user_id}: {record.data.assigned_user_id}</h3>
      <p>Модуль: {moduleName}</p>
      

      <Tabs>
        <TabList>
          <Tab>Карточка {'"'+record.name+'"'}</Tab>
          {relatedModules.map(mod => (
            <Tab key={mod.relatedModuleName}>{mod.label}</Tab>
          ))}
          <Tab>История</Tab>
        </TabList>

        {/* Вкладка с основной информацией, сгруппированной по блокам */}
        <TabPanel>
          <div className="record-details">
            {sortedBlocks.map(([blockName, block]) => {
              const fieldsToDisplay = showEmptyFields
                ? block.fields
                : block.fields.filter(field => field.value && field.value !== "");

              return (
                <div key={blockName} className="record-block">
                  <h3 
                    className="block-header" 
                    onClick={() => toggleBlock(blockName)}
                    style={{ cursor: 'pointer' }}
                  >
                    {blockName} {expandedBlocks[blockName] ? '▼' : '►'}
                  </h3>
                  {expandedBlocks[blockName] && (
                    fieldsToDisplay.length > 0 ? (
                      <table className="record-table">
                        <tbody>
                          {fieldsToDisplay.map((field, index) => (
                            <tr key={index}>
                              <td className="record-label">
                                <strong>{field.label}:</strong>
                              </td>
                              <td className="record-value">
                                {renderFieldValue(field.name, field.value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Нет данных</p>
                    )
                  )}
                </div>
              );
            })}
            {Object.values(mergedRecord).some(block => block.fields.length === 0) && (
              <button
                onClick={() => setShowEmptyFields(!showEmptyFields)}
                className="show-empty-btn"
              >
                {showEmptyFields ? "Скрыть пустые поля" : "Показать пустые поля"}
              </button>
            )}
          </div>
        </TabPanel>

        {/* Вкладки для связанных модулей */}
        {relatedModules.map(mod => (
          <TabPanel key={mod.relatedModuleName}>
            {relatedRecords[mod.relatedModuleName] ? (
              <table>
                <thead>
                  <tr>
                    {Object.entries(relatedRecords[mod.relatedModuleName].headers).map(
                      ([key, label]) => (
                        <th key={key}>{label}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(relatedRecords[mod.relatedModuleName].records).map(
                    ([id, rec]) => (
                      <tr
                        key={id}
                        onClick={() =>
                          navigate(`/modules/${mod.relatedModuleName}/record/${id}`)
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        {Object.entries(relatedRecords[mod.relatedModuleName].headers).map(
                          ([key]) => (
                            <td key={key}>{renderFieldValue(key, rec[key])}</td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <p>Нет данных</p>
            )}
          </TabPanel>
        ))}

        {/* Вкладка с историей записи */}
        <TabPanel>
          <div className="history-timeline">
            {historyData.length > 0 ? (
              historyData.map((item, index) => (
                <div key={index} className="history-event">
                  <span className="history-time"> {item.time} </span>
                  <strong className="history-owner"> {item.owner} → </strong>
                  <span className={`history-status ${item.status}`}> {item.status} </span>
                  {Object.entries(item.data).map(([key, change]) => {
                    // Если change — объект с полем label, обрабатываем как раньше
                    if (typeof change === 'object' && change !== null && change.label) {
                      return (
                        <div key={key} className="history-change">
                          <strong> {change.label}: </strong>
                          {change.from && change.to ? (
                            <span className="history-change-value">
                               {change.from} → {change.to}
                            </span>
                          ) : (
                            <span className="history-new-value">
                               {change.value || change.targetLabel}
                            </span>
                          )}
                        </div>
                      );
                    }
                    // Если change — примитивное значение (например, для событий "добавил")
                    return (
                      <div key={key} className="history-change">
                        <strong>{getLabel(key)}:</strong>
                        <span className="history-new-value"> {change} </span>
                      </div>
                    );
                  })}
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
