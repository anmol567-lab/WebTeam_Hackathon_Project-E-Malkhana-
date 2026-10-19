
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const NewCase = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const [formData, setFormData] = useState({
        crimeNumber: "",
        crimeYear: new Date().getFullYear(),
        stationName: user?.stationName || "",
        investigatingOfficer: user?.username || "",
        officerId: "",
        dateOfFIR: "",
        dateOfSeizure: "",
        actSection: "",
        lawSection: "",
        description: "",

        // Property details
        propertyCategory: "General",
        propertyBelongingTo: "UNKNOWN",
        propertyDescription: "",
        propertyLocation: "",
        propertyQuantity: "",
        propertyNature: "",
        image: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            image: e.target.files?.[0] || null,
        }));
    };

    // Validate every required Case Details field
    const validateCaseDetails = () => {
        const requiredFields = [
            ["crimeNumber", "Crime Number"],
            ["crimeYear", "Year"],
            ["stationName", "Station Name"],
            ["investigatingOfficer", "Investigating Officer"],
            ["officerId", "Officer ID"],
            ["dateOfFIR", "Date of FIR"],
            ["dateOfSeizure", "Date of Seizure"],
            ["actSection", "Act & Section"],
        ];

        for (const [field, label] of requiredFields) {
            if (!String(formData[field] ?? "").trim()) {
                alert(`Please fill in ${label}.`);
                return false;
            }
        }

        if (
            !Number.isInteger(Number(formData.crimeYear)) ||
            Number(formData.crimeYear) < 1
        ) {
            alert("Please enter a valid Year.");
            return false;
        }

        if (
            new Date(formData.dateOfFIR) >
            new Date(formData.dateOfSeizure)
        ) {
            alert("Date of FIR cannot be after the Date of Seizure.");
            return false;
        }

        return true;
    };

    // Validate Case Details before moving forward
    const handleNext = () => {
        if (!validateCaseDetails()) return;

        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure validation also runs before final submission
        if (!validateCaseDetails()) {
            setStep(1);
            return;
        }

        // Validate required Property Details
        const requiredPropertyFields = [
            ["propertyNature", "Nature of Property"],
            ["propertyLocation", "Storage Location"],
            ["propertyDescription", "Property Description"],
        ];

        for (const [field, label] of requiredPropertyFields) {
            if (!String(formData[field] ?? "").trim()) {
                alert(`Please fill in ${label}.`);
                setStep(2);
                return;
            }
        }

        setLoading(true);

        const data = new FormData();

        Object.keys(formData).forEach((key) => {
            if (key !== "image" && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/cases`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data,
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(
                    result.message || "Failed to create case"
                );
            }

            setSuccessData(result);
            setStep(3);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Success screen
    if (step === 3 && successData) {
        return (
            <div
                className="glass-card"
                style={{
                    padding: "2rem",
                    textAlign: "center",
                }}
            >
                <h2 style={{ color: "var(--color-success)" }}>
                    Case Registered Successfully!
                </h2>

                <p>
                    Case ID:{" "}
                    <strong>
                        {successData.case?.caseId || "N/A"}
                    </strong>
                </p>

                {successData.qrCode && (
                    <div style={{ marginTop: "2rem" }}>
                        <h3>Property QR Code</h3>

                        <img
                            src={successData.qrCode}
                            alt="Property QR Code"
                            style={{
                                maxWidth: "100%",
                                border: "5px solid white",
                                borderRadius: "8px",
                            }}
                        />

                        <p
                            style={{
                                fontSize: "0.9rem",
                                color: "var(--color-text-secondary)",
                                marginTop: "1rem",
                            }}
                        >
                            Print and attach this QR code to the seized
                            property.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => navigate("/dashboard")}
                    className="btn-primary"
                    style={{ marginTop: "2rem" }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ marginBottom: "2rem" }}>
                New Case Entry
            </h1>

            {/* Clickable step navigation */}
            <div style={styles.steps}>
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                        ...styles.stepButton,
                        ...(step === 1
                            ? styles.activeStep
                            : styles.inactiveStep),
                    }}
                >
                    1. Case Details
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (step === 1) {
                            handleNext();
                        } else {
                            setStep(2);
                        }
                    }}
                    style={{
                        ...styles.stepButton,
                        ...(step === 2
                            ? styles.activeStep
                            : styles.inactiveStep),
                    }}
                >
                    2. Property Details
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="glass-card"
                style={{ padding: "2rem" }}
            >
                {/* STEP 1: CASE DETAILS */}
                {step === 1 && (
                    <div style={styles.formGrid}>
                        <div>
                            <label>Crime Number</label>
                            <input
                                type="text"
                                name="crimeNumber"
                                value={formData.crimeNumber}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Year</label>
                            <input
                                type="number"
                                name="crimeYear"
                                value={formData.crimeYear}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Station Name</label>
                            <input
                                type="text"
                                name="stationName"
                                value={formData.stationName}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Investigating Officer</label>
                            <input
                                type="text"
                                name="investigatingOfficer"
                                value={formData.investigatingOfficer}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Date of FIR</label>
                            <input
                                type="date"
                                name="dateOfFIR"
                                value={formData.dateOfFIR}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Date of Seizure</label>
                            <input
                                type="date"
                                name="dateOfSeizure"
                                value={formData.dateOfSeizure}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label>Act & Section</label>
                            <input
                                type="text"
                                name="actSection"
                                value={formData.actSection}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="IPC 302..."
                                required
                            />
                        </div>

                        <div>
                            <label>Officer ID</label>
                            <input
                                type="text"
                                name="officerId"
                                value={formData.officerId}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div style={styles.nextButtonContainer}>
                            <button
                                type="button"
                                onClick={handleNext}
                                className="btn-primary"
                            >
                                Next: Add Property
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PROPERTY DETAILS */}
                {step === 2 && (
                    <div style={styles.formGrid}>
                        <div>
                            <label>Category</label>
                            <select
                                name="propertyCategory"
                                value={formData.propertyCategory}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="General">General</option>
                                <option value="Biological">Biological</option>
                                <option value="Weapon">Weapon</option>
                                <option value="Narcotics">Narcotics</option>
                                <option value="Documents">Documents</option>
                                <option value="Liquor">Liquor</option>
                                <option value="Vehicle">Vehicle</option>
                                <option value="Cash/Jewelry">
                                    Cash/Jewelry
                                </option>
                            </select>
                        </div>

                        <div>
                            <label>Belonging To</label>
                            <select
                                name="propertyBelongingTo"
                                value={formData.propertyBelongingTo}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="UNKNOWN">Unknown</option>
                                <option value="ACCUSED">Accused</option>
                                <option value="COMPLAINANT">
                                    Complainant
                                </option>
                            </select>
                        </div>

                        <div>
                            <label>Nature of Property</label>
                            <input
                                type="text"
                                name="propertyNature"
                                value={formData.propertyNature}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g. Perishable, Explosive"
                                required
                            />
                        </div>

                        <div>
                            <label>Storage Location (Rack/Locker)</label>
                            <input
                                type="text"
                                name="propertyLocation"
                                value={formData.propertyLocation}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g. Locker A-12"
                                required
                            />
                        </div>

                        <div>
                            <label>Quantity / Units</label>
                            <input
                                type="text"
                                name="propertyQuantity"
                                value={formData.propertyQuantity}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g. 1 KG / 2 Pcs"
                            />
                        </div>

                        <div style={{ gridColumn: "span 2" }}>
                            <label>Property Description</label>
                            <textarea
                                name="propertyDescription"
                                value={formData.propertyDescription}
                                onChange={handleChange}
                                className="input-field"
                                rows="3"
                                required
                            />
                        </div>

                        <div style={{ gridColumn: "span 2" }}>
                            <label>Upload Photo</label>
                            <input
                                type="file"
                                name="image"
                                onChange={handleFileChange}
                                className="input-field"
                                accept="image/*"
                            />
                        </div>

                        <div style={styles.propertyButtons}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn-primary"
                                style={{
                                    background: "var(--color-bg-card)",
                                    color: "var(--color-text-primary)",
                                    border: "1px solid var(--glass-border)",
                                }}
                            >
                                Back: Case Details
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading
                                    ? "Registering..."
                                    : "Submit Case & Generate QR"}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

const styles = {
    steps: {
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
    },

    stepButton: {
        flex: 1,
        padding: "1rem",
        border: "none",
        borderRadius: "8px",
        textAlign: "center",
        cursor: "pointer",
        fontSize: "1rem",
        transition: "background 0.2s ease",
    },

    activeStep: {
        background: "var(--color-accent-blue)",
        color: "#fff",
    },

    inactiveStep: {
        background: "rgba(255,255,255,0.1)",
        color: "var(--color-text-primary)",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "1.5rem",
    },

    nextButtonContainer: {
        gridColumn: "span 2",
        marginTop: "1rem",
        textAlign: "right",
    },

    propertyButtons: {
        gridColumn: "span 2",
        marginTop: "1rem",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
    },
};

export default NewCase;
