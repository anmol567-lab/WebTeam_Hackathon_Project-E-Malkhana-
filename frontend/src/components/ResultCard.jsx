
import React from "react";

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const labels = {
  _id: "Record ID",
  caseId: "Case ID",
  propertyId: "Property ID",
  crimeNumber: "Crime Number",
  crimeYear: "Crime Year",
  stationName: "Police Station",
  investigatingOfficer: "Investigating Officer",
  officerId: "Officer ID",
  dateOfFIR: "FIR Date",
  dateOfSeizure: "Seizure Date",
  actSection: "Act",
  lawSection: "Law Section",
  category: "Category",
  belongingTo: "Belongs To",
  nature: "Nature",
  quantity: "Quantity",
  location: "Location",
  description: "Description",
  status: "Status",
  fromLocation: "From Location",
  toLocation: "To Location",
  fromOfficer: "From Officer",
  toOfficer: "To Officer",
  action: "Action",
  purpose: "Purpose",
  remarks: "Remarks",
  disposalType: "Disposal Type",
  courtOrderRef: "Court Order",
  authorisedBy: "Authorized By",
  timestamp: "Date",
  createdAt: "Created At",
  updatedAt: "Updated At",
};

const dateFields = [
  "dateOfFIR",
  "dateOfSeizure",
  "timestamp",
  "createdAt",
  "updatedAt",
  "date",
];

const formatLabel = (key) => {
  if (labels[key]) return labels[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
};

const ResultCard = ({ record, collection }) => {
  const title =
    record.caseId ||
    record.propertyId ||
    record.action ||
    record.disposalType ||
    record._id ||
    `${collection} Record`;

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.length
        ? value.map((item) =>
            typeof item === "object"
              ? JSON.stringify(item)
              : String(item)
          ).join(", ")
        : "None";
    }

    if (typeof value === "object") {
      return (
        <div style={{ paddingLeft: "0.5rem" }}>
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} style={{ marginBottom: "0.5rem" }}>
              <div style={styles.label}>
                {formatLabel(nestedKey)}
              </div>
              <div style={styles.value}>
                {dateFields.includes(nestedKey)
                  ? formatDate(nestedValue)
                  : typeof nestedValue === "object" && nestedValue !== null
                  ? JSON.stringify(nestedValue)
                  : String(nestedValue ?? "N/A")}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (dateFields.includes(key)) {
      return formatDate(value);
    }

    return String(value);
  };

  const excludedFields = ["__v"];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.label}>{collection || "Database"} Record</div>
          <h3 style={styles.title}>{String(title)}</h3>
        </div>

        {record.status && (
          <span
            style={{
              ...styles.badge,
              background:
                record.status === "PENDING"
                  ? "#fef3c7"
                  : record.status === "CLOSED" ||
                    record.status === "DISPOSED"
                  ? "#dcfce7"
                  : "#dbeafe",
              color:
                record.status === "PENDING"
                  ? "#92400e"
                  : record.status === "CLOSED" ||
                    record.status === "DISPOSED"
                  ? "#166534"
                  : "#1d4ed8",
            }}
          >
            {record.status}
          </span>
        )}
      </div>

      <div style={styles.grid}>
        {Object.entries(record)
          .filter(([key]) => !excludedFields.includes(key))
          .map(([key, value]) => (
            <div key={key} style={styles.field}>
              <div style={styles.label}>{formatLabel(key)}</div>
              <div style={styles.value}>
                {formatValue(key, value)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const styles = {
  card: {
    width: "100%",
    boxSizing: "border-box",
    padding: "1rem",
    borderRadius: "12px",
    background: "var(--color-bg-card)",
    border: "1px solid var(--glass-border)",
    color: "var(--color-text-primary)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  title: {
    margin: "0.25rem 0 0",
    color: "var(--color-accent-blue)",
    fontSize: "1.1rem",
    overflowWrap: "anywhere",
  },
  badge: {
    padding: "0.35rem 0.7rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: "1rem",
  },
  field: {
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  label: {
    color: "var(--color-text-secondary)",
    fontSize: "0.8rem",
    marginBottom: "0.3rem",
  },
  value: {
    fontSize: "0.9rem",
    fontWeight: 500,
    overflowWrap: "anywhere",
  },
};

export default ResultCard;
