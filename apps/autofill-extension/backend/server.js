import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import selfsigned from 'selfsigned';
import processHtmlRoute from './routes/processhtml.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
const options = { key: pems.private, cert: pems.cert };

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Route for processing HTML
app.use('/process-html', processHtmlRoute);

https.createServer(options, app).listen(port, () => {
  console.log(`Server running on https://localhost:${port}`);
});
