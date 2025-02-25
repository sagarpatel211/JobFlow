import express from 'express';
import { extractFields } from '../utils/extractfields.js';
import { mapField } from '../services/openaifieldmapping.js';

const router = express.Router();

// Define a checklist for job application fields
// "skip" indicates fields that should not be mapped via LLM but simply logged
const jobApplicationChecklist = [
  { field: "first_name", skip: false },
  { field: "last_name", skip: false },
  { field: "email", skip: false },
  { field: "phone", skip: false },
  { field: "resume", skip: false },
  { field: "country", skip: false },
  { field: "city", skip: false },
  { field: "state", skip: false },
  { field: "zip", skip: false },
  { field: "address", skip: false },
  { field: "province", skip: false },
  { field: "cover_letter", skip: false },
  { field: "website", skip: false },
  { field: "linkedin", skip: false },
  { field: "additional_questions", skip: true },
  { field: "background_ethnicity", skip: true },
  { field: "disability", skip: true },
];

router.post('/', async (req, res) => {
  try {
    const { htmlData, completedFields = [] } = req.body;
    if (!htmlData) {
      return res.status(400).json({ success: false, error: "No HTML data received" });
    }

    // Step 1: Extract fields from HTML
    const extractedFields = extractFields(htmlData);

    // Object to hold mapping results
    const mappingResults = {};
    // List to update which fields have been handled
    const updatedCompletedFields = [...completedFields];

    // Process each field in the checklist
    for (const item of jobApplicationChecklist) {
      const { field, skip } = item;

      // Skip if already completed
      if (updatedCompletedFields.includes(field)) {
        continue;
      }

      if (skip) {
        console.log(`Skipping mapping for field: ${field}`);
        updatedCompletedFields.push(field);
        continue;
      }

      // Map one field at a time
      const mapping = await mapField(field, extractedFields);
      if (mapping && Object.keys(mapping).length > 0) {
        mappingResults[field] = mapping;
      } else {
        console.log(`No mapping found for field: ${field}`);
      }
      updatedCompletedFields.push(field);
    }

    return res.json({ success: true, formData: mappingResults, completedFields: updatedCompletedFields });
  } catch (error) {
    console.error("Error processing form:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
