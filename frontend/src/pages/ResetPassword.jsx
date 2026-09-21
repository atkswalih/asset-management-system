import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Save,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post(
        "auth/reset-password/",
        {
          uid,
          token,
          new_password: password,
          confirm_password: confirmPassword,
        },
      );

      setMessage(
        response.data.detail ||
          "Password reset successfully.",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "The reset link is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <LockKeyhole size={22} />
          </div>

          <h1>Reset password</h1>

          <p>
            Create a new password for your account.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="password">
              New password
            </label>

            <div className="password-input-wrapper">
              <input
                id="password"
                className="profile-edit-input"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={8}
                required
              />

              <button
                type="button"
                className="password-field-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword,
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                className="profile-edit-input"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                minLength={8}
                required
              />

              <button
                type="button"
                className="password-field-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword,
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            <Save size={16} />

            {loading
              ? "Resetting..."
              : "Reset password"}
          </button>
        </form>

        <div className="forgot-back">
          <Link to="/login">
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;