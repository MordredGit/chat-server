import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  avatar?: string;
  email: string;
  verified: boolean;
  password: string;
  passwordChangedAt?: Date;
  passwordResetTokent?: string;
  passwordResetExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  otpToken?: string;
  correctPassword: (candidatePassword: string, userPassword: string) => boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  firstName: {
    type: String,
    required: [true, "First Name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
  },
  avatar: String,
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: (email: unknown) =>
        String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ),
      message: ({ value }) => `Email: ${value} is invalid!`,
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, "Password required"],
  },
  passwordChangedAt: Date,
  passwordResetTokent: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date,
  otpToken: String,
});

userSchema.methods.correctPassword = async (
  candidatePassword: string,
  userPassword: string
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
