import jwt from "jsonwebtoken" 
import bcrypt from "bcrypt"
import fs from "fs"
import { Response, Request } from "express"
import { mimeTypes } from "./mimeTypes"
import path from "path"

export const sec = 1 * 1000
export const min = 60 * sec
export const hour = 60 * min
export const day = 24 * hour
export const tokenExpireTime = 15 * min

export function signJWTToken(email: string,userId : string):string{
    let token: string = jwt.sign({
        exp: Math.floor(Date.now() + (15 * tokenExpireTime)) ,
        sub : email,
        iat: Math.floor(Date.now() ),
        userId: userId

    }, process.env.JWT_SECRET as string)
    return token
}

export async function hashPassword(password: string):Promise<string>{
    let hashPassword : string
    const salt = 10;
    try{
     hashPassword = await bcrypt.hash(password, salt)
    }catch(e){
        console.error(e)
        throw e
    }
    return hashPassword 
}

export async function comparePassword(password: string, hash: string):Promise<boolean>{
    let result: boolean
    try{
        result = await bcrypt.compare(password, hash)
    }catch(e){
        console.error(e)
        throw e
    }
    return result
}

export function streamFile(filepath:string, res: Response , req: Request){
     const stat = fs.statSync(filepath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = mimeTypes[path.extname(filepath)] || 'application/octet-stream';

  if (range) {
    // Example: "bytes=1000-"
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable');
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filepath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });

    fileStream.pipe(res);
  } else {
    // No range header, send full file or metadata
    if (contentType.split("/")[0] === 'video') {
        res.status(200).json({
      name: path.basename(filepath),
      size: fileSize,
      type: contentType,
      lastModified: stat.mtime,
    }); 
    return 
    }
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename=${path.basename(filepath)}`
    });
    fs.createReadStream(filepath).pipe(res);
  }
}

export function streamVideo(req: Request, res: Response , filepath: string){
    const stat = fs.statSync(filepath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = mimeTypes[path.extname(filepath)] || 'application/octet-stream';
    if(!range){
        res.status(400).json({
            value: "no range header",
        })
        return 
    }
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable');
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filepath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });

    fileStream.pipe(res);

}