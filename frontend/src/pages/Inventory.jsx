import { useEffect, useState } from "react";
import {
  ClipboardList,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api from "../services/api";

function InventoryModal({
  item,
  onClose,
  onSave,
  saving,
}) {
  const [formData, setFormData] = useState({
    item_type: "",
    quantity: "",
    threshold: "5",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        item_type: item.item_type || "",
        quantity: item.quantity ?? "",
        threshold: item.threshold ?? "5",
      });
    } else {
      setFormData({
        item_type: "",
        quantity: "",
        threshold: "5",
      });
    }
  }, [item]);

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
      item_type: formData.item_type,
      quantity: Number(formData.quantity),
      threshold: Number(formData.threshold),
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
              {item
                ? "Edit Inventory Item"
                : "Add Inventory Item"}
            </h2>

            <p>
              {item
                ? "Update the inventory information."
                : "Add a new item to your inventory."}
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
              <label>Item Type</label>

              <input
                type="text"
                name="item_type"
                placeholder="e.g. HDMI Cable"
                value={formData.item_type}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                name="quantity"
                min="0"
                placeholder="e.g. 25"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Low Stock Threshold</label>

              <input
                type="number"
                name="threshold"
                min="0"
                placeholder="e.g. 5"
                value={formData.threshold}
                onChange={handleChange}
                required
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
                : item
                  ? "Update Item"
                  : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Inventory() {
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] =
    useState(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("inventory/", {
        params: {
          search: search || undefined,
          low_stock: lowStock
            ? "true"
            : undefined,
        },
      });

      const data = response.data;

      setItems(data.results ?? data);
    } catch (err) {
      console.error(
        "Inventory error:",
        err,
      );

      setError(
        "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [search, lowStock]);

  const openAddModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      setError("");

      if (editingItem) {
        await api.put(
          `inventory/${editingItem.id}/`,
          formData,
        );
      } else {
        await api.post(
          "inventory/",
          formData,
        );
      }

      setShowModal(false);
      setEditingItem(null);

      await loadInventory();
    } catch (err) {
      console.error(
        "Save inventory error:",
        err,
      );

      setError(
        "Unable to save the inventory item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.item_type}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `inventory/${item.id}/`,
      );

      await loadInventory();
    } catch (err) {
      console.error(
        "Delete inventory error:",
        err,
      );

      setError(
        "Unable to delete the inventory item.",
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

          <h1>Inventory</h1>

          <p className="page-description">
            Manage stock items and monitor low
            inventory levels.
          </p>
        </div>

        <button
          type="button"
          className="primary-button add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Item
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
              placeholder="Search inventory..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <label className="low-stock-toggle">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(event) =>
                setLowStock(
                  event.target.checked,
                )
              }
            />

            <span>Low stock only</span>
          </label>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Last Updated</th>
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
                    Loading inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-message"
                  >
                    <ClipboardList
                      size={28}
                    />

                    <span>
                      No inventory items
                      found.
                    </span>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="asset-name">
                        <div className="asset-icon">
                          <Package
                            size={17}
                          />
                        </div>

                        <strong>
                          {item.item_type}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {item.quantity}
                      </strong>
                    </td>

                    <td>
                      {item.threshold}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          item.is_low_stock
                            ? "repair"
                            : "available"
                        }`}
                      >
                        {item.is_low_stock
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </td>

                    <td>
                      {item.updated_at
                        ? new Date(
                            item.updated_at,
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
                              item,
                            )
                          }
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          className="table-action delete"
                          title="Delete"
                          onClick={() =>
                            handleDelete(
                              item,
                            )
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
            Showing {items.length} item
            {items.length !== 1
              ? "s"
              : ""}
          </span>
        </div>
      </div>

      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

export default Inventory;