
const { GoogleGenAI, Type } = require("@google/genai");

const Case = require("../models/Case");
const Property = require("../models/Property");
const CustodyLog = require("../models/CustodyLog");
const DisposalRecord = require("../models/DisposalRecord");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELS = {
  Case: {
    model: Case,
    fields: [
      "caseId",
      "crimeNumber",
      "crimeYear",
      "stationName",
      "investigatingOfficer",
      "officerId",
      "dateOfFIR",
      "dateOfSeizure",
      "actSection",
      "lawSection",
      "status",
      "disposalDetails.type",
      "disposalDetails.orderRef",
      "disposalDetails.date",
      "createdAt",
      "updatedAt",
    ],
  },

  Property: {
    model: Property,
    fields: [
      "caseId",
      "category",
      "belongingTo",
      "nature",
      "quantity",
      "location",
      "description",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },

  CustodyLog: {
    model: CustodyLog,
    fields: [
      "propertyId",
      "caseId",
      "fromLocation",
      "fromOfficer",
      "toLocation",
      "toOfficer",
      "action",
      "purpose",
      "remarks",
      "timestamp",
    ],
  },

  DisposalRecord: {
    model: DisposalRecord,
    fields: [
      "propertyId",
      "caseId",
      "disposalType",
      "courtOrderRef",
      "remarks",
      "authorisedBy",
      "date",
    ],
  },
};

const PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    collection: {
      type: Type.STRING,
      enum: ["Case", "Property", "CustodyLog", "DisposalRecord", "NONE"],
    },
    filters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field: {
            type: Type.STRING,
            enum: [
              "caseId",
              "crimeNumber",
              "crimeYear",
              "stationName",
              "investigatingOfficer",
              "officerId",
              "dateOfFIR",
              "dateOfSeizure",
              "actSection",
              "lawSection",
              "status",
              "disposalDetails.type",
              "disposalDetails.orderRef",
              "disposalDetails.date",
              "createdAt",
              "updatedAt",
              "category",
              "belongingTo",
              "nature",
              "quantity",
              "location",
              "description",
              "propertyId",
              "fromLocation",
              "fromOfficer",
              "toLocation",
              "toOfficer",
              "action",
              "purpose",
              "remarks",
              "timestamp",
              "disposalType",
              "courtOrderRef",
              "authorisedBy",
              "date",
            ],
          },
          operator: {
            type: Type.STRING,
            enum: ["eq", "contains", "gt", "gte", "lt", "lte"],
          },
          value: {
            type: Type.STRING,
          },
        },
        required: ["field", "operator", "value"],
      },
    },
    limit: {
      type: Type.INTEGER,
    },
  },
  required: ["collection", "filters", "limit"],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getQuery(userQuestion) {
  const prompt = `
You are a natural-language query planner for a police
e-Malkhana property management application.

Available Mongoose models and fields:

Case:
caseId, crimeNumber, crimeYear, stationName,
investigatingOfficer, officerId, dateOfFIR,
dateOfSeizure, actSection, lawSection, status,
disposalDetails.type, disposalDetails.orderRef,
disposalDetails.date, createdAt, updatedAt.

Property:
caseId, category, belongingTo, nature, quantity,
location, description, status, createdAt, updatedAt.

CustodyLog:
propertyId, caseId, fromLocation, fromOfficer,
toLocation, toOfficer, action, purpose, remarks, timestamp.

DisposalRecord:
propertyId, caseId, disposalType, courtOrderRef,
remarks, authorisedBy, date.

Rules:
1. Select the model relevant to the question.
2. Use only the listed fields.
3. Use only the allowed operators.
4. For exact matches, use eq.
5. For partial text matches, use contains.
6. Use gt, gte, lt or lte for comparisons.
7. For "all records", return an empty filters array.
8. If the question cannot be answered from these models,
   select NONE.
9. Return only a query plan. Never generate JavaScript,
   MongoDB aggregation pipelines, or executable code.
10. Use a maximum limit of 50.
11. Use ISO date strings for dates and strings for all values.

Examples:
Question: Find pending cases
Plan: Case, status eq PENDING

Question: Find properties in the evidence room
Plan: Property, location contains evidence room

Question: Find cases from 2025
Plan: Case, crimeYear eq 2025

Question: Show all custody logs
Plan: CustodyLog, no filters

Question: What is the weather today?
Plan: NONE

User question:
${userQuestion}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PLAN_SCHEMA,
    },
  });

  const plan = JSON.parse(response.text);

  if (!MODELS[plan.collection]) {
    if (plan.collection === "NONE") {
      return {
        collection: null,
        results: [],
      };
    }

    throw new Error("Gemini returned an invalid collection");
  }

  if (!Array.isArray(plan.filters)) {
    throw new Error("Invalid filters returned by Gemini");
  }

  const { model, fields } = MODELS[plan.collection];

  if (plan.filters.length > 10) {
    throw new Error("Too many query filters");
  }

  const conditions = plan.filters.map((filter) => {
    const { field, operator, value } = filter;

    if (
      !fields.includes(field) ||
      typeof value !== "string" ||
      !["eq", "contains", "gt", "gte", "lt", "lte"].includes(operator)
    ) {
      throw new Error("Invalid query filter");
    }

    const schemaPath = model.schema.path(field);

    if (!schemaPath) {
      throw new Error(`Unknown schema field: ${field}`);
    }

    if (
      operator === "contains" &&
      schemaPath.instance !== "String"
    ) {
      throw new Error("contains can only be used on string fields");
    }

    let mongoOperator;

    switch (operator) {
      case "eq":
        mongoOperator = { $eq: value };
        break;

      case "contains":
        mongoOperator = {
          $regex: escapeRegex(value),
          $options: "i",
        };
        break;

      case "gt":
        mongoOperator = { $gt: value };
        break;

      case "gte":
        mongoOperator = { $gte: value };
        break;

      case "lt":
        mongoOperator = { $lt: value };
        break;

      case "lte":
        mongoOperator = { $lte: value };
        break;
    }

    return { [field]: mongoOperator };
  });

  const mongoFilter =
    conditions.length > 0 ? { $and: conditions } : {};

  const limit = Math.max(
    1,
    Math.min(Number.isInteger(plan.limit) ? plan.limit : 10, 50)
  );

  const results = await model
    .find(mongoFilter)
    .limit(limit)
    .lean();

  return {
    collection: plan.collection,
    results,
  };
}

module.exports = { getQuery };
