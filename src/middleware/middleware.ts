import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  user?: string;
  userId?: string;
}

export function isAuth(req: CustomRequest, res: Response, next: NextFunction) {
  console.log(req.path);
  let token: string = req.headers["authorization"] as string;

  if (!token) {
    res.status(401).send("Unauthorized: No token provided");
    return;
  }

  if (token.split(" ")[0] !== "Bearer") {
    console.log("No Bearer token");
    res.status(401).send("Unauthorized no Bearer");
    return;
  }

  try {
    jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET as string,
      (err, decoded) => {
        if (err) {
          res.status(401).send("Unauthorized");
          return;
        }
        if (!decoded || typeof decoded === "string") {
          res.status(401).send("Unauthorized");
          return;
        }
        if (Date.now() > decoded.exp!) {
          res.status(401).send("Unauthorized session expired");
          return;
        }
        req.user = decoded.sub;
        req.userId = decoded.userId;
        next();
      }
    );
  } catch (err) {
    res.status(401).send("Unauthorized");
    return;
  }
}

export function verifySignedUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { expires, sig } = req.query;
  if (!expires || !sig) {
    res.status(400).send("Missing signature parameters");
    return;
  }

  // 2a. Check expiration
  const now = Math.floor(Date.now());
  if (now > Number(expires)) {
    console.log("expired")
    res.status(403).send("URL has expired");
    return;
  }

  // 2b. Recompute HMAC
  console.log(req.path)
  const resourcePath = req.path; // e.g. "/stream/video.mp4"
  const hmac = crypto.createHmac(
    "sha256",
    process.env.URL_SIGNING_KEY as string
  );
  hmac.update(resourcePath + expires);
  const expectedSig = hmac.digest("hex");

  // 2c. Constant-time compare
  const sigBuf = Buffer.from(sig as string, "hex");
  const expectBuf = Buffer.from(expectedSig, "hex");
  if (
    sigBuf.length !== expectBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectBuf)
  ) {
    console.log("invalid")
    res.status(401).send("Invalid signature");
    return;
  }
  next();
}
