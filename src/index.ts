
import express from 'express';
import cors from 'cors';
import router from './routes/routes';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/",router);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});