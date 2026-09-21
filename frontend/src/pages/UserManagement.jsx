import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Edit,
  LogIn,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import api from "../services/api";


function UserManagement() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    phone: "",
    about: "",
    is_active: true,
  });


  /*
   * LOAD USERS
   */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "admin/users/",
      );

      const data =
        response.data.results ??
        response.data;

      setUsers(data);
    } catch (err) {
      console.error(
        "User management error:",
        err,
      );

      if (
        err.response?.status === 403
      ) {
        setError(
          "You do not have permission to manage users.",
        );
      } else {
        setError(
          "Unable to load users.",
        );
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);


  /*
   * FORM
   */

  const resetForm = () => {
    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department: "",
      phone: "",
      about: "",
      is_active: true,
    });
  };


  const openAddModal = () => {
    resetForm();

    setEditingUser(null);

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  const openEditModal = (user) => {
    setEditingUser(user);

    setFormData({
      username: user.username || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      password: "",
      role: user.role || "EMPLOYEE",
      department: user.department || "",
      phone: user.phone || "",
      about: user.about || "",
      is_active:
        user.is_active ?? true,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingUser(null);

    resetForm();
  };


  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  /*
   * CREATE / UPDATE USER
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    setError("");
    setSuccess("");

    try {
      const payload = {
        username:
          formData.username.trim(),

        first_name:
          formData.first_name.trim(),

        last_name:
          formData.last_name.trim(),

        email:
          formData.email.trim(),

        role: formData.role,

        department:
          formData.department.trim(),

        phone:
          formData.phone.trim(),

        about:
          formData.about.trim(),

        is_active:
          formData.is_active,
      };


      /*
       * Password is only sent when:
       * - creating a user
       * - changing an existing password
       */

      if (
        formData.password.trim()
      ) {
        payload.password =
          formData.password;
      }


      if (editingUser) {
        await api.patch(
          `admin/users/${editingUser.id}/`,
          payload,
        );

        setSuccess(
          "User updated successfully.",
        );
      } else {
        await api.post(
          "admin/users/",
          {
            ...payload,

            password:
              formData.password ||
              "Employee@123",
          },
        );

        setSuccess(
          "User created successfully.",
        );
      }


      setShowModal(false);

      setEditingUser(null);

      resetForm();

      await loadUsers();
    } catch (err) {
      console.error(
        "Save user error:",
        err,
      );

      if (err.response?.data) {
        const data =
          err.response.data;

        if (
          typeof data === "object"
        ) {
          const messages =
            Object.entries(data)
              .map(
                ([field, value]) => {
                  const message =
                    Array.isArray(value)
                      ? value.join(" ")
                      : String(value);

                  return `${field}: ${message}`;
                },
              )
              .join(" ");

          setError(
            messages ||
              "Unable to save user.",
          );
        } else {
          setError(String(data));
        }
      } else {
        setError(
          "Unable to save user.",
        );
      }
    } finally {
      setSaving(false);
    }
  };


  /*
   * IMPERSONATE EMPLOYEE
   */

  const handleImpersonate = async (
    user,
  ) => {
    if (user.role === "ADMIN") {
      setError(
        "Administrator accounts cannot be accessed this way.",
      );

      return;
    }


    const confirmed =
      window.confirm(
        `Access ${
          user.full_name ||
          user.username
        }'s account?\n\nYou will temporarily enter this employee's account for 15 minutes.`,
      );


    if (!confirmed) {
      return;
    }


    try {
      setError("");
      setSuccess("");


      /*
       * Save the administrator's
       * current tokens BEFORE replacing them.
       */

      const adminAccessToken =
        localStorage.getItem(
          "access_token",
        );

      const adminRefreshToken =
        localStorage.getItem(
          "refresh_token",
        );


      if (!adminAccessToken) {
        setError(
          "Administrator session not found. Please log in again.",
        );

        return;
      }


      const response =
        await api.post(
          `admin/users/${user.id}/impersonate/`,
        );


      /*
       * Store administrator session.
       */

      localStorage.setItem(
        "admin_access_token",
        adminAccessToken,
      );


      if (adminRefreshToken) {
        localStorage.setItem(
          "admin_refresh_token",
          adminRefreshToken,
        );
      }


      /*
       * Store impersonation information.
       */

      localStorage.setItem(
        "impersonation",
        JSON.stringify({
          employee:
            response.data.user,

          log_id:
            response.data.log_id,

          expires_in:
            response.data.expires_in ||
            900,
        }),
      );


      /*
       * Switch to employee session.
       */

      localStorage.setItem(
        "access_token",
        response.data.access,
      );


      if (response.data.refresh) {
        localStorage.setItem(
          "refresh_token",
          response.data.refresh,
        );
      }


      /*
       * Move into the employee dashboard.
       */

      window.location.href =
        "/dashboard";
    } catch (err) {
      console.error(
        "Impersonation error:",
        err,
      );

      setError(
        err.response?.data?.detail ||
          "Unable to access this account.",
      );
    }
  };


  /*
   * DELETE USER
   */

  const handleDelete = async (
    user,
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${
          user.full_name ||
          user.username
        }?\n\nThis cannot be undone.`,
      );


    if (!confirmed) {
      return;
    }


    try {
      setError("");
      setSuccess("");


      await api.delete(
        `admin/users/${user.id}/`,
      );


      setSuccess(
        "User deleted successfully.",
      );


      await loadUsers();
    } catch (err) {
      console.error(
        "Delete user error:",
        err,
      );


      setError(
        err.response?.data?.detail ||
          "Unable to delete this user.",
      );
    }
  };


  /*
   * SEARCH
   */

  const filteredUsers =
    users.filter((user) => {
      const searchText =
        search
          .toLowerCase()
          .trim();


      if (!searchText) {
        return true;
      }


      return (
        user.username
          ?.toLowerCase()
          .includes(searchText) ||

        user.full_name
          ?.toLowerCase()
          .includes(searchText) ||

        user.email
          ?.toLowerCase()
          .includes(searchText) ||

        user.department
          ?.toLowerCase()
          .includes(searchText) ||

        user.role
          ?.toLowerCase()
          .includes(searchText)
      );
    });


  return (
    <div className="page">

      {/* PAGE HEADER */}

      <div className="page-header user-management-page-header">

        <div>

          <p className="page-kicker">
            ADMINISTRATION
          </p>

          <h1>
            User Management
          </h1>

          <p className="page-description">
            Manage employees,
            administrators, access
            and profile information.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={17} />

          Add User
        </button>

      </div>


      {/* SUCCESS */}

      {success && (
        <div className="page-success">
          {success}
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}


      {/* USERS CARD */}

      <div className="user-management-card">

        <div className="user-management-toolbar">

          <div className="user-management-title">

            <div className="user-management-icon">
              <UserRound size={19} />
            </div>


            <div>

              <h2>
                Users
              </h2>

              <span>
                {users.length}{" "}
                {users.length === 1
                  ? "user"
                  : "users"}{" "}
                registered
              </span>

            </div>

          </div>


          {/* SEARCH */}

          <div className="table-search user-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        {/* TABLE */}

        {loading ? (

          <div className="user-management-loading">
            Loading users...
          </div>

        ) : filteredUsers.length ===
          0 ? (

          <div className="user-management-empty">

            <UserRound size={30} />

            <strong>
              No users found
            </strong>

            <span>
              Try changing your
              search or add a new
              user.
            </span>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    User
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (user) => (

                    <tr key={user.id}>

                      {/* USER */}

                      <td>

                        <div className="managed-user">

                          <div className="managed-user-avatar">

                            {(
                              user.full_name ||
                              user.username
                            )
                              .split(" ")
                              .map(
                                (name) =>
                                  name[0],
                              )
                              .join("")
                              .slice(
                                0,
                                2,
                              )
                              .toUpperCase()}

                          </div>


                          <div>

                            <strong>
                              {user.full_name ||
                                user.username}
                            </strong>

                            <span>
                              @
                              {
                                user.username
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* EMAIL */}

                      <td>
                        {user.email ||
                          "Not provided"}
                      </td>


                      {/* ROLE */}

                      <td>

                        <span
                          className={`role-badge ${
                            user.role ===
                            "ADMIN"
                              ? "admin"
                              : "employee"
                          }`}
                        >

                          <ShieldCheck
                            size={13}
                          />

                          {user.role ===
                          "ADMIN"
                            ? "Admin"
                            : "Employee"}

                        </span>

                      </td>


                      {/* DEPARTMENT */}

                      <td>
                        {user.department ||
                          "Not assigned"}
                      </td>


                      {/* STATUS */}

                      <td>

                        {user.is_active ? (

                          <span className="status-badge available">

                            <CheckCircle2
                              size={13}
                            />

                            Active

                          </span>

                        ) : (

                          <span className="status-badge retired">

                            <XCircle
                              size={13}
                            />

                            Inactive

                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="user-actions">

                          {/* ACCESS EMPLOYEE */}

                          {user.role !==
                            "ADMIN" &&
                            user.is_active && (

                              <button
                                type="button"
                                className="table-action access"
                                onClick={() =>
                                  handleImpersonate(
                                    user,
                                  )
                                }
                                title="Access employee account"
                              >
                                <LogIn
                                  size={16}
                                />
                              </button>

                            )}


                          {/* EDIT */}

                          <button
                            type="button"
                            className="table-action edit"
                            onClick={() =>
                              openEditModal(
                                user,
                              )
                            }
                            title="Edit user"
                          >
                            <Edit
                              size={16}
                            />
                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="table-action delete"
                            onClick={() =>
                              handleDelete(
                                user,
                              )
                            }
                            title="Delete user"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ADD / EDIT MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="modal-card user-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p>
                  {editingUser
                    ? "Update this user's account and profile."
                    : "Create a new AssetFlow user."}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
            >

              <div className="modal-form-grid">

                {/* USERNAME */}

                <div className="form-group">

                  <label>
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. arjun"
                    required
                  />

                </div>


                {/* ROLE */}

                <div className="form-group">

                  <label>
                    Role
                  </label>

                  <select
                    name="role"
                    value={
                      formData.role
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="EMPLOYEE">
                      Employee
                    </option>

                    <option value="ADMIN">
                      Administrator
                    </option>

                  </select>

                </div>


                {/* FIRST NAME */}

                <div className="form-group">

                  <label>
                    First Name
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="First name"
                  />

                </div>


                {/* LAST NAME */}

                <div className="form-group">

                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Last name"
                  />

                </div>


                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="user@example.com"
                  />

                </div>


                {/* PASSWORD */}

                <div className="form-group">

                  <label>
                    {editingUser
                      ? "New Password"
                      : "Password"}
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Minimum 8 characters"
                    }
                    required={
                      !editingUser
                    }
                    minLength="8"
                  />

                </div>


                {/* DEPARTMENT */}

                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Development"
                  />

                </div>


                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Phone number"
                  />

                </div>


                {/* ABOUT */}

                <div className="form-group full-width">

                  <label>
                    About
                  </label>

                  <textarea
                    name="about"
                    value={
                      formData.about
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Write something about this user..."
                    rows="5"
                  />

                </div>


                {/* ACTIVE */}

                <div className="form-group full-width">

                  <label className="checkbox-label">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        formData.is_active
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      Account is active
                    </span>

                  </label>

                </div>

              </div>


              {/* MODAL ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default UserManagement;