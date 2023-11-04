import { Router } from "express";
import { updateUserProfile } from "../controllers/user";
import { protect } from "../controllers/auth";

const userRouter = Router();

userRouter.patch("/update-user-profile", protect, updateUserProfile);

export default userRouter;
