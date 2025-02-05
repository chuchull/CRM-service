import { Link } from 'react-router-dom';
import '../styles/navbar.css'; // Импортируем стили для Navbar

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem('crmToken');
    window.location.href = '/login';
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo">
        <img 
          src="../../Logo.svg"  
          alt="Logo"
        />
        </Link>
        <link rel="icon" type="image/svg+xml" href="/Logo.svg" />
      </div>
      <div className="navbar-center">
        <h3>DC CRM</h3>
      </div>
      <div className="navbar-right">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}