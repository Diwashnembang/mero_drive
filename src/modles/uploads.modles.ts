import { Prisma, PrismaClient, Uploads, User } from "@prisma/client";
import { GetBatchResult } from "@prisma/client/runtime/library";
import { withAccelerate } from "@prisma/extension-accelerate";
import { info } from "node:console";
import { promises } from "node:dns";

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

export async function deleteFilesFromDB(user: string, id: string[]): Promise<boolean> {
  try {
    let result: GetBatchResult = await prisma.uploads.deleteMany({
      where: {
        AND: [
          {
            user: {
              email: user,
            },
          },
          {
            id: {
              in: id,
            },
          },
        ],
      },
    });
    if (result.count === 0) {
      throw new Error("Could not delete files");
    }
    return true;
  } catch (err) {
    throw err;
  }
}

export async function getFilesPath(user: string, id: string[]): Promise<Uploads[]> {
  try {
    let files: Uploads[] = await prisma.uploads.findMany({
      where: {
        AND: [
          {
            user: {
              email: user,
            }
          },
          {
            id: {
              in: id,
            }
          }
        ]
      },
    });
    if (id.length !== files.length) {
      throw new Error("Some of the files ids are not found");
    }
    return files;
  } catch (err) {
    throw err;
  }

}
export async function getSharedFilePath(id: string): Promise<Uploads> {
    try {
      let file: Uploads | null = await prisma.uploads.findUnique({
        where: {
          id: id,
        },
      });
      if (!file) {
        throw new Error("File not found");
      }
      return file;
    } catch (err) {
      throw err;
    }
  }

  export async function updateIsShared(user: string, id: string, shared: boolean): Promise<boolean> {
    try {
      let result: GetBatchResult = await prisma.uploads.updateMany({
        where: {
          AND: [
            {
              user: {
                email: user,
              },
            },
            {
              id: id,
            },
          ],
        },
        data: {
          shared: shared,
        },
      });
      if (result.count === 0) {
        throw new Error("Could not update files");
      }
      return true;
    } catch (err) {
      throw err;
    }
  }