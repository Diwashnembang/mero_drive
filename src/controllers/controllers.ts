import { Request, Response } from "express";
import { createUser, findUser } from "../modles/users.modles";
import { Prisma, User } from "@prisma/client";
import { signJWTToken } from "../helpers/helpers";
import path from "path";
import os from "os";
import fs from "fs";
import { storeFilesToDB } from "../modles/uploads.modles";

export class Controller {
  constructor() {}

  async signUp(req: Request, res: Response) {
    try {
      let user: Prisma.UserCreateInput = req.body as Prisma.UserCreateInput;
      if (!user.email || !user.password) {
        console.error("empty emial or password");
        res.status(400).send("Invalid request");
        return;
      }
      let customer: User = await createUser(user);
      let signedToken: string = signJWTToken(user.email);
      res.cookie("authToken", `Bearer ${signedToken}`);
      let uploadPath: string = path.join(
        os.homedir(),
        `/mero_drive_uploads/${customer.id}`
      );
      fs.mkdir(uploadPath, { recursive: true }, (err) => {
        if (err) throw err;
      });
      res.redirect("/");
    } catch (e) {
      console.error(e);
      res.status(400).send(`invalid request `);
      return;
    }
  }

  async login(req: Request, res: Response) {
    let user: User;
    let userInfo: Prisma.UserCreateInput;
    try {
      userInfo = req.body as Prisma.UserCreateInput;
      if (!userInfo.email || !userInfo.password) {
        console.error("empty emial or password");
        res.status(400).send("Invalid request");
        return;
      }
      user = await findUser(userInfo.email, userInfo.password);
      let signedToken: string = signJWTToken(user.email);
      res.cookie("authToken", `Bearer ${signedToken}`);
      res.redirect("/");
    } catch (e) {
      console.error(e);
      res.status(400).send(`invalid request `);
      return;
    }
  }
  async upload(req: Request, res: Response) {
    let userid: string = req.body.userId;

    if (!userid) {
      res.status(400).send("NO user id");
    }
    if (req.files === undefined || !Array.isArray(req.files)) {
      res.status(400).send("No file uploaded");
      return;
    }
    let promises = req.files.map((file: Express.Multer.File) => {
      const uploadDetail: Prisma.UploadsCreateInput = {
        path: file.path,
        user: {
          connect: {
            id: userid,
          },
        },
      };
      return storeFilesToDB(uploadDetail);
    });

    try {
      await Promise.all(promises);
      res.status(200).send("Files uploaded successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error uploading files");
    }
  }
}
