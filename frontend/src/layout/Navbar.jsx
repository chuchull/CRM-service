import '../styles/navbar.css'; // Импортируем стили для Navbar

export default function Navbar() {
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
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}