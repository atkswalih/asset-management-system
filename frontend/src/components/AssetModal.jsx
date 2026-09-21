import { useEffect, useState } from "react";

function AssetModal({
  asset,
  onClose,
  onSave,
  saving,
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    serial_number: "",
    status: "AVAILABLE",
    purchase_date: "",
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || "",
        type: asset.type || "",
        serial_number: asset.serial_number || "",
        status: asset.status || "AVAILABLE",
        purchase_date: asset.purchase_date || "",
      });
    } else {
      setFormData({
        name: "",
        type: "",
        serial_number: "",
        status: "AVAILABLE",
        purchase_date: "",
      });
    }
  }, [asset]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (typeof onSave !== "function") {
      console.error("AssetModal: onSave prop is missing.");
      return;
    }

    onSave(formData);
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>
              {asset ? "Edit Asset" : "Add Asset"}
            </h2>

            <p>
              {asset
                ? "Update the asset information."
                : "Add a new asset to your organization."}
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
            <div className="form-group">
              <label>Asset Name</label>

              <input
                type="text"
                name="name"
                placeholder="e.g. Dell Latitude 5450"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Asset Type</label>

              <input
                type="text"
                name="type"
                placeholder="e.g. Laptop"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>

              <input
                type="text"
                name="serial_number"
                placeholder="e.g. DL5450-001"
                value={formData.serial_number}
                onChange={handleChange}
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

            <div className="form-group full-width">
              <label>Purchase Date</label>

              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
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
                : asset
                  ? "Update Asset"
                  : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetModal;