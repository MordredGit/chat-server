import { type Request, Response, NextFunction } from "express";
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

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if a verified user is already present
  const existingUser = await User.findOne({ email: email }).select("+verified");

  if (existingUser && existingUser.verified) {
    return res.status(400).json({
      status: "error",
      message: "Verified User already present with same email. Please log in.",
    });
  } else if (existingUser) {
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { firstName, lastName, password },
      { new: true, validateModifiedOnly: true }
    );

    req.body.userId = updatedUser._id;
    return next();
  }

  const newUser = await User.create({ firstName, lastName, email, password });
  req.body.userId = newUser._id;
  return next();
};
