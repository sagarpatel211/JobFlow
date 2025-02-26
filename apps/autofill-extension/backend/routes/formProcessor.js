const express = require('express');
const { extractFormFields, deduplicateFormFields } = require('../utils/extractFormFields');
const computeSimilarity = require('../utils/computeSimilarity');
const performMatching = require('../utils/performMatching');

const router = express.Router();

const candidateData = {
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  email: "john.doe@example.com",
  resume: "path/to/resume.pdf",
  coverLetter: "path/to/coverLetter.pdf",
  transcript: "path/to/transcript.pdf"
};

router.post('/processForm', async (req, res) => {
  try {
    const html = req.body.html;
    if (!html) return res.status(400).json({ error: "Missing HTML in request body." });

    console.log("Extracting form fields...");
    const rawFormFields = extractFormFields(html);
  if (!rawFormFields.length) {
    console.error("No form fields found in the HTML.");
    return res.json({ fillInstructions: [] });
  }
    const formFields = deduplicateFormFields(rawFormFields);
    const candidateFieldTypes = Object.keys(candidateData);
    const costMatrix = [];

    for (let i = 0; i < formFields.length; i++) {
      costMatrix[i] = [];
      for (let j = 0; j < candidateFieldTypes.length; j++) {
        const score = await computeSimilarity(formFields[i], candidateFieldTypes[j]);
        costMatrix[i][j] = 1 - score;
      }
    }

    const assignments = performMatching(costMatrix);
    const fillInstructions = [];

    assignments.forEach(([formIndex, candidateIndex]) => {
      const field = formFields[formIndex];
      const candidateKey = candidateFieldTypes[candidateIndex];
      const candidateValue = candidateData[candidateKey];

      if ((1 - costMatrix[formIndex][candidateIndex]) > 0.5) {
        let selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
        fillInstructions.push({ selector, action: "fill", value: candidateValue, candidateField: candidateKey });
      }
    });

    res.json({ fillInstructions });

  } catch (error) {
    console.error("Error processing form:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
