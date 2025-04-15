import { Request, Response, NextFunction } from 'express';
import jwt  from 'jsonwebtoken';

export interface CustomRequest extends Request {
    user?: string;
    userId?:string
}

export function isAuth(req: CustomRequest, res: Response, next: NextFunction) {
    console.log(req.path);
    const token:string = req.cookies.access_token
    console.log(token)
    if (!token) {
        res.status(401).send('Unauthorized: No token provided');
        return;
    }

    if (token.split(" ")[0] !== 'Bearer') {
        console.log('No Bearer token');
        res.status(401).send('Unauthorized no Bearer');
        return;
    }

    try {
        jwt.verify(token.split(" ")[1], process.env.JWT_SECRET as string, (err, decoded) => {
            if (err) {
                res.status(401).send('Unauthorized');
                return;
            }
            if (!decoded || typeof decoded === 'string') {
                res.status(401).send('Unauthorized');
                return;
            }
            if (Date.now() > decoded.exp!) {
                res.status(401).send('Unauthorized session expired');
                return;
            }
            req.user = decoded.sub
            req.userId = decoded.userId
            next();
        });
    } catch (err) {
        res.status(401).send('Unauthorized');
        return;
    }
}