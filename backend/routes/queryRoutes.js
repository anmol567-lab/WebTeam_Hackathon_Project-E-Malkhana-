
const express = require("express");
const { getQuery } = require("../services/QueryService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid question.",
      });
    }

    const response = await getQuery(message.trim());

    if (response.collection === null) {
      return res.status(200).json({
        success: true,
        answer: "I couldn't answer that using the available schemas.",
        results: [],
      });
    }

    return res.status(200).json({
      success: true,
      collection: response.collection,
      answer: response.results.length
        ? "Query executed successfully."
        : "No matching records found.",
      results: response.results,
    });
  } catch (error) {
    console.error("Query service error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your question.",
    });
  }
});

module.exports = router;
