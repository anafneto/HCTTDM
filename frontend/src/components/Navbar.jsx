import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/api";
import '../App.css'

function Navbar() {
  return (
    <nav
      className="navbar navbar-expand-lg bg-white fixed-top"
      style={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
      }}
    >
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center" style={{ opacity: "75%" }} to="/">
          <img src="/logo.png" alt="Logo" style={{ height: "20px", marginRight: "10px" }} />
        </Link>

        <div className="ms-auto d-flex gap-2">
          {/* <Link to="/" className="btn btn-roxo px-4" style={{ borderRadius: "8px" }}>
            Home
          </Link> */}
          <NavbarProfileOrLogout />
        </div>
      </div>
    </nav>
  );
}
function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout} className="btn btn-outline-danger px-4" style={{ borderRadius: '8px' }}>
      Logout
    </button>
  );
}

function NavbarProfileOrLogout() {
  const location = useLocation();
  const user = authService.getCurrentUser();
  
  if (!user) {
    return (
      <Link to="/login" className="btn btn-light px-4" style={{ borderRadius: "8px" }}>
        Login
      </Link>
    );
  }

  if (location.pathname === '/profile') {
    return <LogoutButton />;
  }

  return (
    <Link to="/profile" className="btn btn-light px-4" style={{ borderRadius: "8px" }}>
      <i style={{ fontSize: "20px", lineHeight: 1, color: "#4a5dd4" }} className="bi bi-person-fill"></i>
    </Link>
  );
}

export default Navbar;