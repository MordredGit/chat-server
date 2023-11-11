import { type Request, Response, NextFunction } from "express";
import User from "../models/User";
import jwtPkg, { JwtPayload } from "jsonwebtoken";
const { sign, verify } = jwtPkg;
// import { generate } from "otp-generator";
import { generateOtp, verifyOtp } from "generateotp-ts";
import crypto from "crypto";
import { Types } from "mongoose";
import { promisify } from "util";
import { sendEmail } from "../services/mailer";

const signToken = (userId: Types.ObjectId) =>
  sign({ userId }, process.env.JWT_SECRET);

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Email and password are required!",
    });
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({
      status: "error",
      message: "Email or password is incorrect",
    });
  }

  const token = signToken(user._id);

  return res.status(200).json({
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
  newUser.save();
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
  const { otp, token } = generateOtp(6, "10m");
  await User.findByIdAndUpdate(userId, {
    otpToken: token,
  });

  // TODO: Send mail with otp to user
  sendEmail({
    sender: "mshagun2001@gmail.com",
    recepient: "pariber565@newnime.com",
    subject: "OTP for Tawk",
    text: `Your OTP is ${otp}. It is valid for 10 min from ${new Date().toLocaleString()}`,
  })
    .then(() => {
      return res.status(200).json({
        status: "success",
        message: "OTP Sent Successfully!",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        status: "error",
        message: "OTP Could not be sent. Please try again later!",
      });
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
  const token = signToken(user._id);

  return res.status(200).json({
    status: "success",
    message: "OTP Verified Successfully!",
    token,
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  // 1. Get User's Email
  const { email } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    res.status(404).json({
      status: "error",
      message: "There is no user found with given email address",
    });
  }

  // 2. Generate random reset token.
  const resetToken = user.createPasswordResetToken();
  const resetUrl = `https://localhost:3000/auth/reset-password/${resetToken}`;
  try {
    // TODO: Send reset password mail to user
    console.log(resetUrl);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: "success",
      message: "Reset Password sent to your mail",
    });
  } catch (error) {
    console.log(error);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({
      status: "error",
      message: "Error sending the email, please try again later",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  // 1. Get reset token and password from user.
  const { resetToken } = req.params;
  const { password } = req.body;
  console.log(resetToken, password);

  // 2. Get User from db based on reset token while checking if it is before the expiry time limit.
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
  })
    .where("passwordResetExpires")
    .gt(Date.now());
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Token is either invalid or expired",
    });
  }

  // 3. Update db with new user creds.
  user.password = password;
  user.passwordChangedAt = new Date(Date.now());
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 4. Log in and send new JWT to client.
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
    token,
  });
  // 5. send mail to user informing password change. TODO
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get JWT token and validating it.
  let token: string;

  if (req.body.authorization && req.body.authorization.startsWith("Bearer")) {
    token = req.body.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    return res.status(401).json({
      status: "error",
      message: "You are not logged in! Please log in to continue",
    });
  }

  // Verification of token
  // Check if promisify is necessary here.
  const decoded = (await promisify<string, string>(verify)(
    token,
    process.env.JWT_SECRET
  )) as unknown as JwtPayload;

  // Check if user still exists
  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "The user doesn't exist",
    });
  }

  // Check if user has changed password after this token was issued.
  if (user.changedPasswordAfterTokenIssued(decoded.iat)) {
    return res.status(401).json({
      status: "error",
      message: "User password updated recently. Please log in again",
    });
  }

  req.body.user = user;
  next();
};
