import { useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Send,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(
        "Please enter your email address.",
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "auth/forgot-password/",
          {
            email: email.trim(),
          },
        );

      setSuccess(
        response.data.detail ||
          "If an account exists with that email, a reset link has been sent.",
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to process the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <KeyRound size={25} />
          </div>

          <h1>AssetFlow</h1>
          <p>Asset Management System</p>
        </div>

        <div className="login-heading">
          <h2>Forgot password?</h2>

          <p>
            Enter your account email and
            we'll send you a password reset
            link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {success && (
            <div className="page-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <Send size={17} />

            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>

        <div className="forgot-back">
          <Link to="/login">
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>

        <div className="login-footer">
          AssetFlow • Internal Management Portal
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;