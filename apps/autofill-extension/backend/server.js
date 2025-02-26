const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/dotenv');
const formProcessor = require('./routes/formProcessor');

const app = express();

app.use(cors());
app.use(express.json({ limit: '40mb' }));
app.use('/', formProcessor);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
