const axios = require('axios');
const { USE_LLM, LLM_API_URL } = require('../config/dotenv');

const candidateFieldSynonyms = {
  firstName: ["first name", "given name", "forename"],
  lastName: ["last name", "family name", "surname"],
  fullName: ["full name", "complete name"],
  email: ["email", "e-mail", "contact email"],
  resume: ["resume", "CV"],
  coverLetter: ["cover letter", "motivation letter"],
  transcript: ["transcript", "academic record"]
};

async function computeSimilarity(formField, candidateFieldKey) {
  const candidateSynonyms = candidateFieldSynonyms[candidateFieldKey].join(", ");
  const prompt = `
Evaluate the similarity between a form field description and a candidate data type.
Form Field Description: "${formField.description}"
Candidate Data Type: "${candidateFieldKey}" (synonyms: ${candidateSynonyms}).
Provide a similarity score between 0 (no match) and 1 (perfect match) in JSON format like {"score": 0.85}.
  `;

  console.log(`Computing similarity for: ${formField.description} <-> ${candidateFieldKey}`);

  if (USE_LLM) {
    try {
      const response = await axios.post(LLM_API_URL, { prompt, model: "deepseek-r1:1.5b", max_tokens: 50 });
      const data = response.data;
      console.log("LLM API Response:", data);
      return data?.score || 0;
    } catch (error) {
      console.error("LLM API Error:", error.message);
      return 0;
    }
  } else {
    let score = 0;
    const description = formField.description.toLowerCase();
    if (description.includes(candidateFieldKey.toLowerCase())) {
      score = 1.0;
    } else {
      for (const synonym of candidateFieldSynonyms[candidateFieldKey]) {
        if (description.includes(synonym.toLowerCase())) {
          score = 0.8;
          break;
        }
      }
    }
    return score;
  }
}

module.exports = computeSimilarity;
