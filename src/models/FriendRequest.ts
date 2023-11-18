import mongoose, { CallbackWithoutResultAndOptionalError } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IFriendRequest
  extends mongoose.Document<mongoose.Types.ObjectId> {
  sender: mongoose.Schema.Types.ObjectId;
  recipient: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const requestSchema = new mongoose.Schema<IFriendRequest>({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const FriendRequest = mongoose.model("FriendRequest", requestSchema);
export default FriendRequest;
