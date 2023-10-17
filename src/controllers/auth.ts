import { type Request, Response } from "express";
import User from "../models/User";
import { sign } from "jsonwebtoken";

const signToken = (userId: string) => sign({ userId }, process.env.JWT_SECRET);

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body();

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Email and password are required!",
    });
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || user.correctPassword(password, user.password)) {
    res.status(400).json({
      status: "error",
      message: "Email or password is incorrect",
    });
  }

  const token = signToken(user._id as unknown as string);

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
  });
};
