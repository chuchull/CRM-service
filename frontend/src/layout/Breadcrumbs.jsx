import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Сегменты, которые никогда не должны быть кликабельными ссылками
const skipLinkSegments = ['record', 'modules'];

const Breadcrumbs = () => {
  const location = useLocation();
  // Разбиваем путь на части, убираем пустые строки (если путь начинается со слеша)
  const pathnames = location.pathname.split('/').filter(Boolean);

  return (
    <nav className='breadcrumb-nav' aria-label="breadcrumb">
      <ol className="breadcrumb">
        {/* Первый элемент "Main" – ссылка на /home */}
        <li className="breadcrumb-item">
          <Link to="/home">Main</Link>
        </li>

        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const fullPath = `/${pathnames.slice(0, index + 1).join('/')}`;

          // Если сегмент в списке пропускаемых или это последний сегмент,
          // делаем его просто текстом (не ссылкой).
          if (skipLinkSegments.includes(segment) || isLast) {
            return (
              <li key={fullPath} className="breadcrumb-item active" aria-current="page">
                {segment}
              </li>
            );
          }

          // Иначе делаем ссылку
          return (
            <li key={fullPath} className="breadcrumb-item">
              <Link to={fullPath}>{segment}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
