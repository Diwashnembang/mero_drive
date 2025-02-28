import { Prisma, PrismaClient,User} from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { hashPassword,comparePassword } from "../helpers/helpers";

const prisma = new PrismaClient().$extends(withAccelerate()); 

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
        
    let hashedPassword : string
    try{
        hashedPassword = await  hashPassword(data.password)
        data.password = hashedPassword
        const user = await prisma.user.create({
            data: data
        });
        return user;
    }catch(err){
        console.error(`Error:  could not create user`);
        throw err;
    }
}


export async function findUser(email: string,password:string ): Promise<User> {
    let user : User | null;
    try {
         user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            throw new Error(`Error: could not find user by email`);
        }
    } catch (err) {
        console.error(`Error: could not find user by email`);
        throw err;
    }
    try {
        let isAuth : boolean = await comparePassword(password, user.password);
        if (!isAuth) {
            throw new Error(`Error: password does not match`);
        }
        return user;
    }catch(err){   
        console.error(`Error: password does not match`);
        throw err;
        
    }
}