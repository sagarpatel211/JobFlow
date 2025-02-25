import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Maps a single field (e.g., "first_name") using the extracted form fields.
 * @param {string} fieldKey - The job application field key (e.g., "first_name").
 * @param {Array} extractedFields - The array of fields extracted from the HTML.
 * @returns {Object|null} The mapping object or null if mapping failed.
 */
export const mapField = async (fieldKey, extractedFields) => {
  // Build a prompt focused on just one field
  const prompt = `
You are an expert form parser. Your task is to map a single field from a job application form.
Focus only on the field: "${fieldKey}".
Provide a CSS selector for this field and a dummy value, following this format:

{
  "selector": "css-selector-for-${fieldKey}",
  "value": "dummy_value"
}

If no obvious input element is found, return an empty object.

Extracted Fields:
${JSON.stringify(extractedFields, null, 2)}
`;

  try {
    // const completion = await client.chat.completions.create({
    //   model: 'gpt-3.5-turbo',
    //   messages: [
    //     { role: 'system', content: 'You are an expert form parser.' },
    //     { role: 'user', content: prompt }
    //   ],
    //   max_tokens: 150,
    //   temperature: 0,
    // });

    // const responseText = completion.choices[0].message.content;
    const reponseText = "some temp response text";
    let mapping;
    try {
      mapping = JSON.parse(responseText);
    } catch (e) {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        mapping = JSON.parse(match[0]);
      } else {
        console.error(`Mapping failed for field "${fieldKey}" due to parsing error.`);
        return null;
      }
    }

    return mapping;
  } catch (error) {
    console.error(`Error mapping field "${fieldKey}":`, error);
    return null;
  }
};
