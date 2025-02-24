// backend/llm_helper.js

async function identifyFieldType(fieldDesc, openaiApiKey) {
  const promptText = fieldDesc.slice(0, 50);
  const prompt = `Identify the type of form field for the following label: "${promptText}". Respond in valid JSON format with keys "type" and "confidence". "type" must be one of: first_name, last_name, email, phone, resume, cover_letter, sponsorship, dei, or other. "confidence" must be a number between 0 and 100 indicating your confidence.`;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that identifies form field types for job applications." },
          { role: "user", content: prompt }
        ],
        max_tokens: 50,
        temperature: 0
      })
    });
    const data = await response.json();
    const message = data.choices[0].message.content;
    return JSON.parse(message);
  } catch (error) {
    console.error("❌ Error in identifyFieldType:", error);
  }
  return { type: "other", confidence: 0 };
}

// Expose globally.
window.identifyFieldType = identifyFieldType;
