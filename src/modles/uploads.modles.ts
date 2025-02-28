import { Prisma, PrismaClient, Uploads, User } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function storeFilesToDB(
  data: Prisma.UploadsCreateInput
): Promise<Uploads> {
  try {
    let uploadedInfo: Uploads = await prisma.uploads.create({
      data: data,
    });
    return uploadedInfo;
  } catch (err) {
    throw err;
  }
}
