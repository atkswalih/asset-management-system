import { useEffect, useState } from "react";
import {
  CalendarDays,
  Edit,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import api from "../services/api";

function AssignmentModal({
  assignment,
  assets,
  users,
  onClose,
  onSave,
  saving,
}) {
  const [formData, setFormData] = useState({
    asset: "",
    employee: "",
    date_assigned: "",
    date_returned: "",
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        asset: assignment.asset || "",
        employee: assignment.employee || "",
        date_assigned:
          assignment.date_assigned || "",
        date_returned:
          assignment.date_returned || "",
      });
    } else {
      setFormData({
        asset: "",
        employee: "",
        date_assigned: "",
        date_returned: "",
      });
    }
  }, [assignment]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      asset: Number(formData.asset),
      employee: Number(formData.employee),
      date_assigned: formData.date_assigned,
      date_returned:
        formData.date_returned || null,
    });
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal-card"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h2>
              {assignment
                ? "Edit Assignment"
                : "Assign Asset"}
            </h2>

            <p>
              {assignment
                ? "Update the asset assignment."
                : "Assign an asset to an employee."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <div className="form-group full-width">
              <label>Asset</label>

              <select
                name="asset"
                value={formData.asset}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select an asset
                </option>

                {assets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.name} —{" "}
                    {asset.serial_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Employee</label>

              <select
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select an employee
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.full_name} (
                    {user.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date Assigned</label>

              <input
                type="date"
                name="date_assigned"
                value={
                  formData.date_assigned
                }
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Date Returned</label>

              <input
                type="date"
                name="date_returned"
                value={
                  formData.date_returned
                }
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
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
                : assignment
                  ? "Update Assignment"
                  : "Assign Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Assignments() {
  const [assignments, setAssignments] =
    useState([]);

  const [assets, setAssets] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingAssignment, setEditingAssignment] =
    useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assignmentsResponse,
        assetsResponse,
        usersResponse,
      ] = await Promise.all([
        api.get("assignments/", {
          params: {
            search:
              search || undefined,
          },
        }),
        api.get("assets/"),
        api.get("users/"),
      ]);

      setAssignments(
        assignmentsResponse.data.results ??
          assignmentsResponse.data,
      );

      setAssets(
        assetsResponse.data.results ??
          assetsResponse.data,
      );

      setUsers(
        usersResponse.data.results ??
          usersResponse.data,
      );
    } catch (err) {
      console.error(
        "Assignments error:",
        err,
      );

      setError(
        "Unable to load assignments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openAddModal = () => {
    setEditingAssignment(null);
    setShowModal(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAssignment(null);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      setError("");

      if (editingAssignment) {
        await api.put(
          `assignments/${editingAssignment.id}/`,
          formData,
        );
      } else {
        await api.post(
          "assignments/",
          formData,
        );
      }

      setShowModal(false);
      setEditingAssignment(null);

      await loadData();
    } catch (err) {
      console.error(
        "Save assignment error:",
        err,
      );

      const backendError =
        err.response?.data;

      if (backendError) {
        console.error(
          "Backend response:",
          backendError,
        );
      }

      setError(
        "Unable to save the assignment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Delete this assignment for ${assignment.employee_name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `assignments/${assignment.id}/`,
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete assignment error:",
        err,
      );

      setError(
        "Unable to delete the assignment.",
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header assets-header">
        <div>
          <p className="page-kicker">
            MANAGEMENT
          </p>

          <h1>Assignments</h1>

          <p className="page-description">
            Track company assets assigned to
            employees.
          </p>
        </div>

        <button
          type="button"
          className="primary-button add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Assign Asset
        </button>
      </div>

      {error && (
        <div className="page-error">
          {error}
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="asset-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Employee</th>
                <th>Date Assigned</th>
                <th>Date Returned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-message"
                  >
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-message"
                  >
                    <UserRound
                      size={28}
                    />

                    <span>
                      No assignments
                      found.
                    </span>
                  </td>
                </tr>
              ) : (
                assignments.map(
                  (assignment) => (
                    <tr
                      key={
                        assignment.id
                      }
                    >
                      <td>
                        <div className="asset-name">
                          <div className="asset-icon">
                            <ClipboardIcon />
                          </div>

                          <strong>
                            {
                              assignment.asset_name
                            }
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="employee-name">
                          <UserRound
                            size={16}
                          />

                          <span>
                            {
                              assignment.employee_name
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="date-cell">
                          <CalendarDays
                            size={15}
                          />

                          {
                            assignment.date_assigned
                          }
                        </div>
                      </td>

                      <td>
                        {assignment.date_returned ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            assignment.date_returned
                              ? "retired"
                              : "assigned"
                          }`}
                        >
                          {assignment.date_returned
                            ? "Returned"
                            : "Assigned"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="table-action edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                assignment,
                              )
                            }
                          >
                            <Edit
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            className="table-action delete"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                assignment,
                              )
                            }
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing{" "}
            {assignments.length}{" "}
            assignment
            {assignments.length !==
            1
              ? "s"
              : ""}
          </span>
        </div>
      </div>

      {showModal && (
        <AssignmentModal
          assignment={
            editingAssignment
          }
          assets={assets}
          users={users}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        width="8"
        height="4"
        x="8"
        y="2"
        rx="1"
      />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export default Assignments;