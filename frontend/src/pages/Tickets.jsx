import { useEffect, useState } from "react";
import {
  Edit,
  Plus,
  Search,
  Ticket,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";

import api from "../services/api";

function TicketModal({
  ticket,
  assets,
  users,
  onClose,
  onSave,
  saving,
}) {
  const [formData, setFormData] = useState({
    asset: "",
    issue: "",
    status: "OPEN",
    assigned_technician: "",
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        asset: ticket.asset || "",
        issue: ticket.issue || "",
        status: ticket.status || "OPEN",
        assigned_technician:
          ticket.assigned_technician || "",
      });
    } else {
      setFormData({
        asset: "",
        issue: "",
        status: "OPEN",
        assigned_technician: "",
      });
    }
  }, [ticket]);

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
      issue: formData.issue,
      status: formData.status,
      assigned_technician:
        formData.assigned_technician
          ? Number(formData.assigned_technician)
          : null,
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
              {ticket
                ? "Edit Repair Ticket"
                : "Create Repair Ticket"}
            </h2>

            <p>
              {ticket
                ? "Update the repair ticket."
                : "Create a new repair request."}
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
              <label>Issue</label>

              <textarea
                name="issue"
                placeholder="Describe the problem with the asset..."
                value={formData.issue}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="OPEN">
                  Open
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="RESOLVED">
                  Resolved
                </option>

                <option value="CLOSED">
                  Closed
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Assigned Technician
              </label>

              <select
                name="assigned_technician"
                value={
                  formData.assigned_technician
                }
                onChange={handleChange}
              >
                <option value="">
                  Unassigned
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
                : ticket
                  ? "Update Ticket"
                  : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tickets() {
  const [tickets, setTickets] =
    useState([]);

  const [assets, setAssets] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingTicket, setEditingTicket] =
    useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        ticketsResponse,
        assetsResponse,
        usersResponse,
      ] = await Promise.all([
        api.get("tickets/", {
          params: {
            search:
              search || undefined,
            status:
              status || undefined,
          },
        }),
        api.get("assets/"),
        api.get("users/"),
      ]);

      setTickets(
        ticketsResponse.data.results ??
          ticketsResponse.data,
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
        "Tickets error:",
        err,
      );

      setError(
        "Unable to load repair tickets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status]);

  const openAddModal = () => {
    setEditingTicket(null);
    setShowModal(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingTicket(null);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      setError("");

      if (editingTicket) {
        await api.put(
          `tickets/${editingTicket.id}/`,
          formData,
        );
      } else {
        await api.post(
          "tickets/",
          formData,
        );
      }

      setShowModal(false);
      setEditingTicket(null);

      await loadData();
    } catch (err) {
      console.error(
        "Save ticket error:",
        err,
      );

      console.error(
        "Backend response:",
        err.response?.data,
      );

      setError(
        "Unable to save the repair ticket.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticket) => {
    const confirmed = window.confirm(
      `Delete Ticket #${ticket.id}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `tickets/${ticket.id}/`,
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete ticket error:",
        err,
      );

      setError(
        "Unable to delete the repair ticket.",
      );
    }
  };

  const getStatusClass = (
    ticketStatus,
  ) => {
    switch (ticketStatus) {
      case "OPEN":
        return "repair";

      case "IN_PROGRESS":
        return "assigned";

      case "RESOLVED":
        return "available";

      case "CLOSED":
        return "retired";

      default:
        return "";
    }
  };

  const getStatusText = (
    ticketStatus,
  ) => {
    switch (ticketStatus) {
      case "OPEN":
        return "Open";

      case "IN_PROGRESS":
        return "In Progress";

      case "RESOLVED":
        return "Resolved";

      case "CLOSED":
        return "Closed";

      default:
        return ticketStatus;
    }
  };

  return (
    <div className="page">
      <div className="page-header assets-header">
        <div>
          <p className="page-kicker">
            SUPPORT
          </p>

          <h1>Repair Tickets</h1>

          <p className="page-description">
            Track asset repairs and maintenance
            requests.
          </p>
        </div>

        <button
          type="button"
          className="primary-button add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Ticket
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
              placeholder="Search tickets..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>

          <select
            className="filter-select"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="">
              All Statuses
            </option>

            <option value="OPEN">
              Open
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Asset</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    Loading repair tickets...
                  </td>
                </tr>
              ) : tickets.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="table-message"
                  >
                    <Ticket size={28} />

                    <span>
                      No repair tickets
                      found.
                    </span>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                  >
                    <td>
                      <div className="asset-name">
                        <div className="asset-icon">
                          <Wrench
                            size={17}
                          />
                        </div>

                        <strong>
                          #{ticket.id}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {ticket.asset_name}
                    </td>

                    <td>
                      <span className="issue-text">
                        {ticket.issue}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {getStatusText(
                          ticket.status,
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="employee-name">
                        <UserRound
                          size={15}
                        />

                        <span>
                          {ticket.technician_name ||
                            "Unassigned"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {ticket.created_at
                        ? new Date(
                            ticket.created_at,
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="table-action edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(
                              ticket,
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
                              ticket,
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {tickets.length} ticket
            {tickets.length !== 1
              ? "s"
              : ""}
          </span>
        </div>
      </div>

      {showModal && (
        <TicketModal
          ticket={editingTicket}
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

export default Tickets;