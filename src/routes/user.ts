import { Router } from "express";
import {
  getFriendRequests,
  getFriends,
  getUsers,
  updateUserProfile,
} from "../controllers/user";
import { protect } from "../controllers/auth";

const userRouter = Router();

userRouter.patch("/update-user-profile", protect, updateUserProfile);
userRouter.get("/get-users", protect, getUsers);
userRouter.get("/get-friends", protect, getFriends);
userRouter.get("/get-friend-requests", protect, getFriendRequests);

export default userRouter;
