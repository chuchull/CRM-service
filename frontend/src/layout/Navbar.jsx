import { useState, useEffect } from 'react';
import { logout } from '../utils/auth';
import { Link } from 'react-router-dom';
export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setDarkMode(storedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const theme = newMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/home">
        <link rel="icon" type="image/svg+xml" href="/Logo.svg" />
        </Link>
      </div>
      <div className="navbar-center">
        <h3>DC CRM</h3>
      </div>
      <div className="navbar-right">
        Темная тема
        <label className="switch">
          <input type="checkbox" checked={darkMode} onChange={handleToggleDarkMode} />
          <span className="slider round"></span>
        </label>
        <button onClick={handleLogout}>Выйти</button>
      </div>
    </div>
  );
}