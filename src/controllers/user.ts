import { type Request, Response } from "express";
import User from "../models/User";

// Needs to be a protected route
export const updateUserProfile = async (req: Request, res: Response) => {
  //  Get user from protected route
  const { user, firstName, lastName, about, avatar } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { firstName, lastName, about, avatar },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    data: updatedUser,
    message: "Profile Updated Successfully",
  });
};