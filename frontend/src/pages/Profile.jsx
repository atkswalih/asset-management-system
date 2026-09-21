import { useEffect, useState } from "react";
import {
  Building2,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    phone: "",
    about: "",
  });

  const [passwordData, setPasswordData] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("auth/me/");

      setUser(response.data);

      setFormData({
        first_name:
          response.data.first_name || "",
        last_name:
          response.data.last_name || "",
        email:
          response.data.email || "",
        department:
          response.data.department || "",
        phone:
          response.data.phone || "",
        about:
          response.data.about || "",
      });
    } catch (err) {
      console.error(
        "Profile error:",
        err,
      );

      setError(
        "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } =
      event.target;

    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          "auth/me/",
          formData,
        );

      setUser(response.data);

      setFormData({
        first_name:
          response.data.first_name || "",
        last_name:
          response.data.last_name || "",
        email:
          response.data.email || "",
        department:
          response.data.department || "",
        phone:
          response.data.phone || "",
        about:
          response.data.about || "",
      });

      setEditing(false);

      setSuccess(
        "Profile updated successfully.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Profile update error:",
        err,
      );

      setError(
        err.response?.data?.detail ||
          "Unable to update the profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      first_name:
        user?.first_name || "",
      last_name:
        user?.last_name || "",
      email:
        user?.email || "",
      department:
        user?.department || "",
      phone:
        user?.phone || "",
      about:
        user?.about || "",
    });

    setEditing(false);
    setError("");
  };

  const openPasswordChange = () => {
    setChangingPassword(true);
    setError("");
    setSuccess("");
  };

  const closePasswordChange = () => {
    setChangingPassword(false);

    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

    setError("");
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (
      !passwordData.current_password ||
      !passwordData.new_password ||
      !passwordData.confirm_password
    ) {
      setError(
        "Please fill in all password fields.",
      );
      return;
    }

    if (
      passwordData.new_password.length < 8
    ) {
      setError(
        "New password must be at least 8 characters.",
      );
      return;
    }

    if (
      passwordData.new_password !==
      passwordData.confirm_password
    ) {
      setError(
        "New passwords do not match.",
      );
      return;
    }

    try {
      setPasswordSaving(true);

      const response =
        await api.post(
          "auth/change-password/",
          passwordData,
        );

      setSuccess(
        response.data.detail ||
          "Password changed successfully.",
      );

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setChangingPassword(false);

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error(
        "Password change error:",
        err,
      );

      setError(
        err.response?.data?.detail ||
          "Unable to change password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const passwordInput = (
    name,
    placeholder,
    value,
    show,
    setShow,
  ) => (
    <div className="password-input-wrapper">
      <input
        className="profile-edit-input"
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handlePasswordChange}
        autoComplete="new-password"
      />

      <button
        type="button"
        className="password-field-toggle"
        onClick={() =>
          setShow((current) => !current)
        }
      >
        {show ? (
          <EyeOff size={17} />
        ) : (
          <Eye size={17} />
        )}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="page">
        <div className="page-error">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName =
    user.full_name ||
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") ||
    user.username;

  const roleText =
    user.role === "ADMIN"
      ? "Administrator"
      : "Employee";

  const initials = fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-kicker">
            ACCOUNT
          </p>

          <h1>Profile</h1>

          <p className="page-description">
            View and manage your account
            information.
          </p>
        </div>

        <div className="profile-header-actions">
          {!editing ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={openPasswordChange}
              >
                <KeyRound size={17} />
                Change Password
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setEditing(true);
                  setSuccess("");
                  setError("");
                }}
              >
                <Edit size={17} />
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
                disabled={saving}
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={17} />
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {success && (
        <div className="page-success">
          {success}
        </div>
      )}

      {error && user && (
        <div className="page-error">
          {error}
        </div>
      )}

      {changingPassword && (
        <div className="profile-card password-change-card">
          <div className="card-header">
            <div>
              <h2>Change Password</h2>

              <p>
                Use your current password to
                create a new password.
              </p>
            </div>

            <button
              type="button"
              className="password-close-button"
              onClick={closePasswordChange}
            >
              <X size={18} />
            </button>
          </div>

          <div className="password-form-grid">
            <div className="form-group">
              <label>
                Current Password
              </label>

              {passwordInput(
                "current_password",
                "Enter current password",
                passwordData.current_password,
                showCurrentPassword,
                setShowCurrentPassword,
              )}
            </div>

            <div className="form-group">
              <label>
                New Password
              </label>

              {passwordInput(
                "new_password",
                "Minimum 8 characters",
                passwordData.new_password,
                showNewPassword,
                setShowNewPassword,
              )}
            </div>

            <div className="form-group">
              <label>
                Confirm New Password
              </label>

              {passwordInput(
                "confirm_password",
                "Confirm new password",
                passwordData.confirm_password,
                showConfirmPassword,
                setShowConfirmPassword,
              )}
            </div>
          </div>

          <div className="password-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={closePasswordChange}
              disabled={passwordSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleChangePassword}
              disabled={passwordSaving}
            >
              <KeyRound size={17} />

              {passwordSaving
                ? "Changing..."
                : "Change Password"}
            </button>
          </div>
        </div>
      )}

      <div className="profile-grid">
        <div className="profile-card profile-main-card">
          <div className="profile-avatar">
            {initials}
          </div>

          <h2>{fullName}</h2>

          <p className="profile-username">
            @{user.username}
          </p>

          <span className="profile-role">
            <ShieldCheck size={15} />
            {roleText}
          </span>

          <div className="profile-divider"></div>

          <p className="profile-status">
            <span className="status-dot"></span>
            Account active
          </p>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <div>
              <h2>
                Personal Information
              </h2>

              <p>
                Your registered account
                details.
              </p>
            </div>
          </div>

          <div className="profile-info-list">
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <UserRound size={18} />
              </div>

              <div className="profile-edit-field">
                <span>First Name</span>

                {editing ? (
                  <input
                    className="profile-edit-input"
                    type="text"
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={handleChange}
                    placeholder="First name"
                  />
                ) : (
                  <strong>
                    {user.first_name ||
                      "Not provided"}
                  </strong>
                )}
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <UserRound size={18} />
              </div>

              <div className="profile-edit-field">
                <span>Last Name</span>

                {editing ? (
                  <input
                    className="profile-edit-input"
                    type="text"
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                ) : (
                  <strong>
                    {user.last_name ||
                      "Not provided"}
                  </strong>
                )}
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <Mail size={18} />
              </div>

              <div className="profile-edit-field">
                <span>Email</span>

                {editing ? (
                  <input
                    className="profile-edit-input"
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={handleChange}
                    placeholder="Email address"
                  />
                ) : (
                  <strong>
                    {user.email ||
                      "Not provided"}
                  </strong>
                )}
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <Phone size={18} />
              </div>

              <div className="profile-edit-field">
                <span>Phone</span>

                {editing ? (
                  <input
                    className="profile-edit-input"
                    type="text"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                ) : (
                  <strong>
                    {user.phone ||
                      "Not provided"}
                  </strong>
                )}
              </div>
            </div>

            <div className="profile-info-row">
              <div className="profile-info-icon">
                <Building2 size={18} />
              </div>

              <div className="profile-edit-field">
                <span>Department</span>

                {editing ? (
                  <input
                    className="profile-edit-input"
                    type="text"
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={handleChange}
                    placeholder="Department"
                  />
                ) : (
                  <strong>
                    {user.department ||
                      "Not assigned"}
                  </strong>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card profile-about-card">
          <div className="card-header">
            <div>
              <h2>About</h2>

              <p>
                Profile information about
                this account.
              </p>
            </div>
          </div>

          {editing ? (
            <textarea
              className="profile-about-input"
              name="about"
              value={formData.about}
              onChange={handleChange}
              placeholder="Write something about yourself..."
              rows="6"
            />
          ) : (
            <p className="profile-about-text">
              {user.about ||
                "No information has been added yet."}
            </p>
          )}
        </div>

        <div className="profile-card">
          <div className="card-header">
            <div>
              <h2>
                Account Details
              </h2>

              <p>
                Information about your
                AssetFlow access.
              </p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-row">
              <span>Username</span>

              <strong>
                {user.username}
              </strong>
            </div>

            <div className="profile-detail-row">
              <span>Role</span>

              <strong>
                {roleText}
              </strong>
            </div>

            <div className="profile-detail-row">
              <span>Access</span>

              <span className="status-badge available">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;