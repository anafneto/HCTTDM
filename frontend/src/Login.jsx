import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './App.css';
import { authService } from "./services/api";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      console.log("Login successful:", response);
      navigate('/profile');
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Credenciais inválidas");
      } else if (err.request) {
        setError("Erro de conexão. Verifique se o servidor está ativo.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6" style={{ maxWidth: "520px" }}>
          <h1 className="text-center mb-5 hello_user">
            Login
          </h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                className="form-control"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  padding: "14px 18px",
                  fontSize: "1.05rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  padding: "14px 18px",
                  fontSize: "1.05rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-roxo w-100 mb-4"
              style={{
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: "500",
                borderRadius: "8px"
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>

            <div className="text-center">
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: "#9ca3af", 
                  textDecoration: "none",
                  fontSize: "0.95rem"
                }}
              >
                Forgot my Password
              </Link>
              <span style={{ color: "#9ca3af", margin: "0 8px" }}>or</span>
              <Link 
                to="/signup" 
                style={{ 
                  color: "#9ca3af", 
                  textDecoration: "none",
                  fontSize: "0.95rem"
                }}
              >
                Create an Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;