import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, userService } from "./services/api";

function Profile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date_of_birth: "",
    region: "",
    grade_level: "",
    other_special_need: "",
    social_context: ""
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    loadUserData(user);
  }, [navigate]);

  const loadUserData = async (user) => {
    try {
      setLoading(true);
      const userData = await userService.getProfile(user.id);

      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        date_of_birth: userData.date_of_birth || "",
        region: userData.region || "",
        grade_level: userData.grade_level || "",
        other_special_need: userData.other_special_need || "",
        social_context: userData.social_context || ""
      });
    } catch (err) {
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      } else {
        setError("Erro ao carregar dados do perfil");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await userService.updateProfile(currentUser.id, formData);
      setSuccess("Perfil atualizado com sucesso!");

      const updatedUser = { ...currentUser, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao atualizar perfil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount(currentUser.id);
      authService.logout();
      navigate('/');
    } catch (err) {
      setError("Erro ao eliminar conta");
      console.error(err);
    }
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="container text-center py-5" style={{ marginTop: "80px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="hello_user">
              Hello, {formData.name || 'User'}!
            </h1>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <h5 className="hello_user mt-5 mb-4">Things to take in account when producing answers</h5>

            <div className="mb-3">
              <label htmlFor="date_of_birth" className="form-label">Birth date</label>
              <input
                type="date"
                className="form-control"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="grade_level" className="form-label">Education level</label>
              <input
                type="text"
                className="form-control"
                id="grade_level"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="other_special_need" className="form-label">Special needs and other particularities</label>
              <input
                type="text"
                className="form-control"
                id="other_special_need"
                name="other_special_need"
                placeholder="e.g., ADHD, Dyslexia, Autism, Dyscalculia"
                value={formData.other_special_need}
                onChange={handleInputChange}
              />
              <small className="text-muted">
                Separate items with commas if applicable
              </small>
            </div>

            <div className="mb-3">
              <label htmlFor="region" className="form-label">Region</label>
              <input
                type="text"
                className="form-control"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="social_context" className="form-label">Social or cultural context</label>
              <input
                type="text"
                className="form-control"
                id="social_context"
                name="social_context"
                value={formData.social_context}
                onChange={handleInputChange}
              />
                            <small className="text-muted">
                Separate items with commas if applicable
              </small>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-danger px-4"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
              <button type="submit" className="btn btn-roxo px-4" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;