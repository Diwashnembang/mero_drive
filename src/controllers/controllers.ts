import { Request, Response } from "express";
import { createUser, findUser } from "../modles/users.modles";
import { Prisma, User} from "@prisma/client";
import { signJWTToken } from "../helpers/helpers";

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
      await createUser(user);
      let signedToken: string = signJWTToken(user.email);
      res.cookie("authToken", `Bearer ${signedToken}`)
      res.send("User created");
    } catch (e) {
      console.error(e);
      res.status(400).send(`invalid request `);
      return;
    }
  }

  async login(req: Request, res: Response) {
    let user : User 
    let userInfo: Prisma.UserCreateInput 
    try{
        userInfo= req.body as Prisma.UserCreateInput;
        if (!userInfo.email || !userInfo.password) {
            console.error("empty emial or password");
            res.status(400).send("Invalid request");
            return;
        }
        user = await findUser(userInfo.email, userInfo.password);
        let signedToken: string = signJWTToken(user.email);
        res.cookie("authToken", `Bearer ${signedToken}`)
        res.send("User logged in");
        
    }catch(e){
        console.error(e);
        res.status(400).send(`invalid request `);
        return;
    }
    

  }
}
