import { Request, Response } from "express";
import { createUser, findUser } from "../modles/users.modles";
import { Prisma, Uploads, User } from "@prisma/client";
import { signJWTToken, streamFile } from "../helpers/helpers";
import path from "path";
import os from "os";
import fs from "fs";
import {
  deleteFilesFromDB,
  getAllUsersFilesID,
  getFilesPath,
  getOneFilePathByID,
  getSharedFilePath,
  storeFilesToDB,
  updateIsShared,
} from "../modles/uploads.modles";
import { CustomRequest } from "../middleware/middleware";
import { get } from "http";

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
      let signedToken: string = signJWTToken(user.email, customer.id);
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

  async login(req: CustomRequest, res: Response) {
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
      let signedToken: string = signJWTToken(user.email, user.id);
      res.status(200).send(signedToken);
      //   res.cookie("authToken", `Bearer ${signedToken}`,{
      //     httpOnly:true
      //   });
      //   res.status(300).redirect("/");
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
      return;
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

  async remove(req: CustomRequest, res: Response) {
    let user = req.user;
    console.log("this is user", user);
    if (!user) {
      res.status(400).send("No user found");
      return;
    }

    let ids: string[] = req.body.ids;
    if (!ids) {
      res.status(400).send("No id's found");
      return;
    }
    if (!Array.isArray(ids)) {
      res.status(400).send("ids should be an array");
      return;
    }

    let files: Uploads[] = [];
    try {
      files = await getFilesPath(user, ids);
    } catch (error) {
      console.error("error getting file path from db", error);
      res.status(500).send("Error deleting files");
      return;
    }

    try {
      files.forEach((file: Uploads) => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(err);
            throw err;
          }
        });
      });
      await deleteFilesFromDB(user, ids);
      res.status(200).send("Files deleted successfully");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting files from storage");
    }
  }

  async getSharedFile(req: CustomRequest, res: Response) {
    let id: string = req.params.id;
    if (!id) {
      res.status(400).send("No file id found");
      return;
    }
    try {
      let file: Uploads = await getSharedFilePath(id);
      if (!file.shared) {
        res.status(400).send("file is not shared");
        return;
      }
      res.status(200).sendFile(file.path, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error getting file");
          return;
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error getting file");
      return;
    }
  }

  async updateIsSharedState(req: CustomRequest, res: Response) {
    let email: string | undefined = req.user;
    let id: string[] = req.body.id;
    let isShared: boolean = req.body.isShared;
    if (!isShared) {
      res.status(400).send("isShared should be a boolean");
      return;
    }

    if (!id) {
      res.status(400).send("No file id found");
      return;
    }
    if (!Array.isArray(id)) {
      res.status(400).send("ids should be an array");
      return;
    }
    if (!email) {
      res.status(400).send("No user found");
      return;
    }
    try {
      let promises: any[] = [];
      let files: Uploads[] = await getFilesPath(email, id);
      files.forEach((file: Uploads) => {
        promises.push(updateIsShared(email, file.id, isShared));
      });
      await Promise.all(promises);
      res.status(200).send("Files shared state updated successfully");
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Error getting files");
      return;
    }
  }

  async getAllFilesID(req: Request, res: Response) {
    let userId: string = req.body.userId;
    let ids: string[] = [];
    try {
      let filePaths: Uploads[] = await getAllUsersFilesID(userId);
      if (filePaths.length === 0) {
        throw new Error("No files found");
      }

      filePaths.forEach((file: Uploads) => {
        ids.push(file.id);
      });
      res.status(200).json(ids);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error getting files id");
      return;
    }
  }

  async getFilesByID(req: CustomRequest, res: Response) {
    let id: string = req.params.id;
    let user: string | undefined = req.user;
    if (!user) {
      res.status(400).send("No user id found");
      return;
    }
    if (!id) {
      res.status(400).send("No file id found");
      return;
    }
    if (typeof id !== "string") {
      res.status(400).send("ids should be a string");
      return;
    }
    try {
      let file: Uploads = await getOneFilePathByID(user, id);
      streamFile(file.path, res);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error getting fiie");
      return;
    }
  }
}
