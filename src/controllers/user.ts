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

export const getUsers = async (req: Request, res: Response) => {
  const currUser = req.body.user;
  const allUsers = await User.find({
    verified: true,
    _id: { $nin: [currUser._id, ...currUser.friends] },
  }).select("firstName lastName _id");

  return res.status(200).json({
    status: "success",
    data: allUsers,
    message: "Users found successfully",
  });
};
