import { Router } from "express";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  sendOTP,
  verifyOTP,
} from "../controllers/auth";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/send-otp", sendOTP);
authRouter.post("/verify-otp", verifyOTP);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
