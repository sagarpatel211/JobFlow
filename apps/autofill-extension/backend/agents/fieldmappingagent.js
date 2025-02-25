import { ChatOpenAI } from "langchain/chat_models/openai";
import { SystemMessage, HumanMessage } from "langchain/schema";
import dotenv from 'dotenv';

dotenv.config();

const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY
});

const processBatch = async (batch) => {
  const systemPrompt = `
You are an AI assistant that analyzes web forms and maps input fields to job application fields. 
Your task is to match extracted fields to the following categories:
- "first_name"
- "last_name"
- "email"
- "phone"
- "resume"
- "cover_letter"
- "linkedin"
- "website"
- "background_ethnicity"
- "disability"
- "additional_questions"

Only process the fields given below, and return JSON formatted mappings.
Example format:
{
  "first_name": { "selector": "input[name='fname']", "value": "John" }
}

Extracted Fields:
${JSON.stringify(batch, null, 2)}
`;

  const response = await llm.call([
    new SystemMessage(systemPrompt),
    new HumanMessage("Map the extracted fields to the correct categories.")
  ]);

  try {
    return JSON.parse(response.content);
  } catch (e) {
    console.error("Error parsing AI response:", e);
    return null;
  }
};

export const fieldMappingAgent = async (fields, checklist) => {
  let mappedFields = {};
  const batchSize = 3;

  for (let i = 0; i < fields.length; i += batchSize) {
    const batch = fields.slice(i, i + batchSize).filter(field => !checklist.has(field.name));
    
    if (batch.length === 0) continue;

    const batchResult = await processBatch(batch);
    if (batchResult) {
      Object.assign(mappedFields, batchResult);
      batch.forEach(field => checklist.add(field.name));
    }
  }

  return mappedFields;
};
