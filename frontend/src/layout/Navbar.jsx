import { useState, useEffect } from 'react';

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
    localStorage.removeItem('crmToken');
    window.location.href = '/login';
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <link rel="icon" type="image/svg+xml" href="/Logo.svg" />
      </div>
      <div className="navbar-center">
        <h3>DC CRM</h3>
      </div>
      <div className="navbar-right">
        <button onClick={handleToggleDarkMode}>Toggle Dark Mode</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}