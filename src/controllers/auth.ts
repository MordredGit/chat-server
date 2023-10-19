import { type Request, Response, NextFunction } from "express";
import User from "../models/User";
import { sign } from "jsonwebtoken";
// import { generate } from "otp-generator";
import { generateOtp, verifyOtp } from "generateotp-ts";

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

export const sendOTP = async (req: Request, res: Response) => {
  const { userId } = req.body;
  // Using otp-generator
  // const newOtp = generate(6, {
  //   lowerCaseAlphabets: false,
  //   upperCaseAlphabets: false,
  //   specialChars: false,
  //   digits: true,
  // });

  // Using otp-generator-ts
  const { /* otp, */ token } = generateOtp(6, "10m");
  await User.findByIdAndUpdate(userId, {
    otpToken: token,
  });

  // TODO: Send mail with otp to user

  return res.status(200).json({
    status: "success",
    message: "OTP Sent Successfully!",
  });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({
      status: "error",
      message: "Email is invalid",
    });

  if (!verifyOtp(otp, user.otpToken))
    return res.status(409).json({
      status: "error",
      message: "OTP is either invalid or expired. Please try again!",
    });

  user.verified = true;
  user.otpToken = undefined;
  await user.save({ validateModifiedOnly: true });
  const token = signToken(user._id as unknown as string);

  return res.status(200).json({
    status: "success",
    message: "OTP Verified Successfully!",
    token,
  });
};

// export const forgotPassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {};

// export const resetPassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {};
