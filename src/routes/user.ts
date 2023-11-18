import { Router } from "express";
import { getUsers, updateUserProfile } from "../controllers/user";
import { protect } from "../controllers/auth";

const userRouter = Router();

userRouter.patch("/update-user-profile", protect, updateUserProfile);
userRouter.get("/get-users", protect, getUsers);

export default userRouter;
