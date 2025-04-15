import { Router } from "express";
import { CustomRequest, isAuth } from "../middleware/middleware";
import { Controller } from "../controllers/controllers";
import multer from "multer";
import path from "path";
import os from "os";


const router = Router();
const controller = new Controller();
const storage = multer.diskStorage({
    destination: function (req : CustomRequest, file, cb) {
        let userId = req.userId as string
        console.log("from multer", userId)
        let uploadPath: string = path.join(
        os.homedir(),`/mero_drive_uploads/${userId}`)
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {    
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })
router.post("/login",controller.login)

router.post("/signup",controller.signUp)


router.use(isAuth)
router.get('/', (req, res) => {
    res.send('Hello World');
});
router.post("/upload",upload.array('uploads'),controller.upload)
router.post("/delete", controller.remove)
router.get("/f/:id", controller.getSharedFile)
router.post("/update",controller.updateIsSharedState)
router.get("/getAllID",controller.getAllFilesID)
router.get("/file/:id",controller.getFilesByID)


export default router;