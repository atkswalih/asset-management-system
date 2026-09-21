import { useEffect, useState } from "react";
import {
  Box,
  Edit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api from "../services/api";
import AssetModal from "../components/AssetModal";

function Assets() {
  const [assets, setAssets] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("assets/", {
        params: {
          search: search || undefined,
          status: status || undefined,
        },
      });

      const data = response.data;

      setAssets(data.results ?? data);
    } catch (err) {
      console.error("Assets error:", err);

      setError("Unable to load assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [search, status]);

  const openAddModal = () => {
    setEditingAsset(null);
    setShowModal(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAsset(null);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      setError("");

      if (editingAsset) {
        await api.put(
          `assets/${editingAsset.id}/`,
          formData,
        );
      } else {
        await api.post("assets/", formData);
      }

      setShowModal(false);
      setEditingAsset(null);

      await loadAssets();
    } catch (err) {
      console.error("Save asset error:", err);

      const backendError = err.response?.data;

      if (backendError?.serial_number) {
        setError(
          `Serial number: ${backendError.serial_number.join(" ")}`,
        );
      } else {
        setError(
          "Unable to save the asset. Please check the form.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset) => {
    const confirmed = window.confirm(
      `Delete "${asset.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`assets/${asset.id}/`);

      await loadAssets();
    } catch (err) {
      console.error("Delete asset error:", err);

      setError("Unable to delete the asset.");
    }
  };

  const getStatusClass = (assetStatus) => {
    switch (assetStatus) {
      case "AVAILABLE":
        return "available";

      case "ASSIGNED":
        return "assigned";

      case "REPAIR":
        return "repair";

      case "RETIRED":
        return "retired";

      default:
        return "";
    }
  };

  const getStatusText = (assetStatus) => {
    switch (assetStatus) {
      case "AVAILABLE":
        return "Available";

      case "ASSIGNED":
        return "Assigned";

      case "REPAIR":
        return "Under Repair";

      case "RETIRED":
        return "Retired";

      default:
        return assetStatus;
    }
  };

  return (
    <div className="page">
      <div className="page-header assets-header">
        <div>
          <p className="page-kicker">
            MANAGEMENT
          </p>

          <h1>Assets</h1>

          <p className="page-description">
            Manage company equipment and assigned assets.
          </p>
        </div>

        <button
          type="button"
          className="primary-button add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Asset
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
              placeholder="Search assets..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            className="filter-select"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">
              All Statuses
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="REPAIR">
              Under Repair
            </option>

            <option value="RETIRED">
              Retired
            </option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Purchase Date</th>
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
                    Loading assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-message"
                  >
                    <Box size={28} />

                    <span>
                      No assets found.
                    </span>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div className="asset-name">
                        <div className="asset-icon">
                          <Box size={17} />
                        </div>

                        <strong>
                          {asset.name}
                        </strong>
                      </div>
                    </td>

                    <td>{asset.type}</td>

                    <td>
                      <span className="serial-number">
                        {asset.serial_number}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          asset.status,
                        )}`}
                      >
                        {getStatusText(
                          asset.status,
                        )}
                      </span>
                    </td>

                    <td>
                      {asset.purchase_date}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="table-action edit"
                          title="Edit"
                          onClick={() =>
                            openEditModal(asset)
                          }
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          className="table-action delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(asset)
                          }
                        >
                          <Trash2 size={16} />
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
            Showing {assets.length} asset
            {assets.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {showModal && (
        <AssetModal
          asset={editingAsset}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

export default Assets;