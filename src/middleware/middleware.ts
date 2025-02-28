import { Request, Response, NextFunction } from 'express';
import jwt  from 'jsonwebtoken';
import { sec } from '../helpers/helpers';

export function isAuth(req: Request, res: Response, next: NextFunction) {
    console.log(req.path);
    const token:string = req.cookies.authToken 
    if (!token) {
        res.status(401).send('Unauthorized: No token provided');
        return;
    }

    if (token.split(" ")[0] !== 'Bearer') {
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
        });
    } catch (err) {
        res.status(401).send('Unauthorized');
        return;
    }
    next();
}