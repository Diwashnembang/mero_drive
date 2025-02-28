import { Router } from "express";
import { isAuth } from "../middleware/middleware";
import { Controller } from "../controllers/controllers";


const router = Router();
const controller = new Controller();
router.post("/login",controller.login)

router.post("/signup",controller.signUp)


router.use(isAuth)
router.get('/', (req, res) => {
    res.send('Hello World');
});



export default router;