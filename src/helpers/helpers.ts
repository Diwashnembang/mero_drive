import jwt from "jsonwebtoken" 
import bcrypt from "bcrypt"
import fs from "fs"
import { Response } from "express"
import { mimeTypes } from "./mimeTypes"
import path from "path"

export const sec = 1 * 1000
export const min = 60 * sec
export const hour = 60 * min
export const day = 24 * hour

export function signJWTToken(email: string,userId : string):string{
    let token: string = jwt.sign({
        exp: Math.floor(Date.now() + (15 * min)) ,
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

export function streamFile(filepath:string, res: Response){
    let readStream = fs.createReadStream(filepath,{
        highWaterMark: 1024 * 1024 * 10, // 10MB chunks
    })
    res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filepath)] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${path.basename(filepath)}`,
        'Content-Length': fs.statSync(filepath).size,
    })
    readStream.pipe(res)
}