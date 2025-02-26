require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  USE_LLM: process.env.USE_LLM === 'true',
  LLM_API_URL: process.env.LLM_API_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
