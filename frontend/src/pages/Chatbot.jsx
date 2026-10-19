
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaRobot, FaPaperPlane } from "react-icons/fa";
import ResultCard from "../components/ResultCard";

// For Vite, environment variables must use import.meta.env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Chatbot = () => {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hello! I'm your AI Assistant. Ask me about cases, seized properties, custody records, or disposal records.",
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Automatically scroll to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    const sendMessage = async (e) => {
        e.preventDefault();

        const question = input.trim();

        if (!question || loading) return;

        // Display the user's message immediately
        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                text: question,
            },
        ]);

        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${API_URL}/api/query`,
                { message: question },
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                    },
                }
            );

            const data = response.data;

            // Store results separately so they can be rendered as cards
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: data.answer || "Here are your results.",
                    collection: data.collection,
                    results: Array.isArray(data.results)
                        ? data.results
                        : [],
                    isError: false,
                },
            ]);
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Unable to connect to the AI Assistant. Please try again.";

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: errorMessage,
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div className="glass-card" style={styles.container}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.icon}>
                        <FaRobot size={24} />
                    </div>

                    <div>
                        <h2 style={styles.heading}>
                            YOUR AI ASSISTANT
                        </h2>

                        <p style={styles.subtitle}>
                            Ask questions about your e-Malkhana records
                        </p>
                    </div>
                </div>

                {/* Chat messages and result cards */}
                <div style={styles.chatArea}>
                    {messages.map((message, index) => {
                        const hasResults =
                            message.role === "assistant" &&
                            Array.isArray(message.results) &&
                            message.results.length > 0;

                        return (
                            <div
                                key={index}
                                style={{
                                    ...styles.messageRow,
                                    justifyContent:
                                        message.role === "user"
                                            ? "flex-start"
                                            : "flex-end",
                                }}
                            >
                                {hasResults ? (
                                    // Display every database record as a card
                                    <div style={styles.resultsContainer}>
                                        <div style={styles.resultsHeading}>
                                            <span>
                                                {message.text}
                                            </span>

                                            <span style={styles.resultCount}>
                                                {message.results.length}{" "}
                                                {message.results.length === 1
                                                    ? "record"
                                                    : "records"}{" "}
                                                found
                                            </span>
                                        </div>

                                        {message.results.map(
                                            (record, recordIndex) => (
                                                <ResultCard
                                                    key={
                                                        record._id ||
                                                        recordIndex
                                                    }
                                                    record={record}
                                                    collection={
                                                        message.collection
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    // Normal user and assistant messages
                                    <div
                                        style={{
                                            ...styles.message,
                                            ...(message.role === "user"
                                                ? styles.userMessage
                                                : styles.botMessage),
                                            ...(message.isError
                                                ? styles.errorMessage
                                                : {}),
                                        }}
                                    >
                                        {message.text}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Loading indicator */}
                    {loading && (
                        <div
                            style={{
                                ...styles.messageRow,
                                justifyContent: "flex-end",
                            }}
                        >
                            <div style={styles.botMessage}>
                                Thinking...
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form
                    onSubmit={sendMessage}
                    style={styles.inputForm}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about cases, properties, custody..."
                        disabled={loading}
                        style={styles.input}
                    />

                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        style={{
                            ...styles.sendButton,
                            opacity:
                                loading || !input.trim() ? 0.6 : 1,
                            cursor:
                                loading || !input.trim()
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        aria-label="Send message"
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: {
        padding: "1.5rem",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
    },

    container: {
        height: "100%",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--color-bg-card)",
    },

    header: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.25rem",
        borderBottom: "1px solid var(--glass-border)",
    },

    icon: {
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-accent-blue)",
        color: "white",
        flexShrink: 0,
    },

    heading: {
        margin: 0,
        color: "var(--color-accent-blue)",
        fontSize: "1.2rem",
    },

    subtitle: {
        margin: "0.4rem 0 0",
        color: "var(--color-text-secondary)",
        fontSize: "0.85rem",
    },

    chatArea: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },

    messageRow: {
        display: "flex",
        width: "100%",
        minWidth: 0,
    },

    message: {
        maxWidth: "85%",
        padding: "0.9rem 1rem",
        borderRadius: "12px",
        fontSize: "0.95rem",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
    },

    userMessage: {
        background: "var(--color-accent-blue)",
        color: "#ffffff",
        borderBottomLeftRadius: "3px",
    },

    botMessage: {
        background: "var(--color-bg-card)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--glass-border)",
        borderBottomRightRadius: "3px",
    },

    errorMessage: {
        color: "var(--color-danger)",
    },

    resultsContainer: {
        width: "100%",
        maxWidth: "900px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },

    resultsHeading: {
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        color: "var(--color-text-primary)",
        fontSize: "0.95rem",
        lineHeight: 1.5,
    },

    resultCount: {
        color: "var(--color-text-secondary)",
        fontSize: "0.8rem",
    },

    inputForm: {
        display: "flex",
        gap: "0.75rem",
        padding: "1rem",
        borderTop: "1px solid var(--glass-border)",
    },

    input: {
        flex: 1,
        minWidth: 0,
        padding: "0.9rem 1rem",
        borderRadius: "10px",
        border: "1px solid var(--glass-border)",
        outline: "none",
        background: "var(--color-bg-card)",
        color: "var(--color-text-primary)",
        fontSize: "0.95rem",
    },

    sendButton: {
        width: "48px",
        minWidth: "48px",
        border: "none",
        borderRadius: "10px",
        background: "var(--color-accent-blue)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
};

export default Chatbot;
