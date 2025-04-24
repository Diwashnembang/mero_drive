import express from 'express';
import cors from 'cors';
import router from './routes/routes';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import https from 'https';
import path from 'path';
dotenv.config();
const app = express();
const port = 8006;

try {
    fs.mkdir(os.homedir() + '/mero_drive_uploads', { recursive: true }, (err) => {
        if (err) throw err;
    });
} catch(err) {
    console.error(`Error: could not create directory`); 
    process.exit(1);
}

const allowedOrigins = [
  'https://localhost:5173',
  'https://mero-drive-frontend.vercel.app'
];
app.set('trust proxy', true);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // 👈 important if you're using cookies
}));
app.use(express.json());
app.use(cookieParser());
app.use("/",router);

if (process.env.NODE_ENV === 'development') {
  const options = {
    key: fs.readFileSync(path.resolve('cert/key.pem')),
    cert: fs.readFileSync(path.resolve('cert/cert.pem'))
  }
  
  https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS server running on https://localhost:${port}`)
  });
} else {
  app.listen(port, () => {
    console.log(`HTTP server running on http://localhost:${port}`);
  });
}