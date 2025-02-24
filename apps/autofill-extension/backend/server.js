import express from 'express';
import cors from 'cors';
import { load } from 'cheerio';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Initialize the OpenAI client using ES module syntax.
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file.
});

/**
 * POST /process-html
 * Expects { htmlData } in the JSON body.
 * Parses the HTML with Cheerio, extracts input fields,
 * and then builds a GPT prompt to map these to our target fields.
 */
app.post('/process-html', async (req, res) => {
  try {
    const { htmlData } = req.body;
    if (!htmlData) {
      return res.status(400).json({ success: false, error: "No HTML data received" });
    }

    // Parse HTML using Cheerio's load function
    const $ = load(htmlData);
    let fields = [];
    $('input').each((i, elem) => {
      const inputType = $(elem).attr('type') || 'text';
      const name = $(elem).attr('name') || '';
      const id = $(elem).attr('id') || '';
      let label = '';
      if (id) {
        label = $(`label[for="${id}"]`).text().trim();
      }
      if (!label) {
        label = $(elem).attr('placeholder') || '';
      }
      fields.push({
        tag: 'input',
        type: inputType,
        name,
        id,
        label,
      });
    });

    // Build prompt for GPT-4 mapping
    const prompt = `
You are an expert form parser. Given the following extracted form fields from an HTML page, map them to the target fields:
- "first_name"
- "last_name"
- "email"
- "resume"

For each target field, provide a CSS selector that uniquely identifies the input element and assign these dummy values:
- first_name: "John"
- last_name: "Doe"
- email: "johndoe@example.com"
- resume: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

If a target field cannot be reliably mapped, omit it.

Return your answer as JSON in this format:
{
  "first_name": { "selector": "input[name='fname']", "value": "John" },
  "last_name": { "selector": "input#lname", "value": "Doe" },
  "email": { "selector": "input[name='email']", "value": "johndoe@example.com" },
  "resume": { "selector": "input[type='file']", "value": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
}

Extracted Fields:
${JSON.stringify(fields, null, 2)}
`;

    // Use the OpenAI client to get the mapping.
    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are an expert form parser.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0,
    });

    const responseText = completion.data.choices[0].message.content;
    let mapping;
    try {
      mapping = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ success: false, error: "Failed to parse GPT response" });
    }

    return res.json({ success: true, formData: mapping });
  } catch (error) {
    console.error("Error processing form:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
