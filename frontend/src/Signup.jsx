import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './App.css';
import { authService } from "./services/api";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    date_of_birth: "",
    region: "",
    grade_level: "",
    other_special_need: "",
    social_context: ""
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

    if (formData.password !== formData.confirmPassword) {
      setError("As passwords não coincidem!");
      return;
    }

    if (!formData.name || !formData.email || !formData.password || !formData.date_of_birth) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
        region: formData.region || null,
        grade_level: formData.grade_level || null,
        other_special_need: formData.other_special_need || null,
        social_context: formData.social_context || null
      };

      const response = await authService.register(userData);
      console.log("Conta criada com sucesso:", response);

      navigate('/login');
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Erro ao criar conta");
      } else if (err.request) {
        setError("Erro de conexão. Verifique se o servidor está ativo.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <h1 className="text-center mb-4 hello_user">
            Create Account
          </h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <h5 className="hello_user mt-5 mb-4">Things to take in account when producing answers</h5>

            <div className="mb-3">
              <label className="form-label">Birth date *</label>
              <input
                type="date"
                className="form-control"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Education level</label>
              <input
                type="text"
                className="form-control"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Special needs and other particularities</label>
              <input
                type="text"
                className="form-control"
                name="other_special_need"
                placeholder="e.g., ADHD, Dyslexia, Autism, Dyscalculia"
                value={formData.other_special_need}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
              <small className="text-muted">
                Separate items with commas if applicable
              </small>
            </div>

            <div className="mb-4">
              <label className="form-label">Region</label>
              <input
                type="text"
                className="form-control"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Social or cultural context</label>
              <input
                type="text"
                className="form-control"
                name="social_context"
                value={formData.social_context}
                onChange={handleInputChange}
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
                            <small className="text-muted">
                Separate items with commas if applicable
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-roxo w-100 mb-3"
              disabled={loading}
              style={{
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: "500",
                borderRadius: "8px"
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                style={{
                  color: "#9ca3af",
                  textDecoration: "none",
                  fontSize: "0.95rem"
                }}
              >
                Go back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;