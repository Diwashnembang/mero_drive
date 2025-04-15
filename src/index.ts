import express from 'express';
import cors from 'cors';
import router from './routes/routes';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
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

app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/",router);


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});