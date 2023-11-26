import mongoose from "mongoose";

export interface IOneToOneMessage
  extends mongoose.Document<mongoose.Types.ObjectId> {
  participants: mongoose.Schema.Types.ObjectId[];
  messages: {
    from: mongoose.Schema.Types.ObjectId;
    to: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    text?: string;
    file?: string;
  }[];
}

const oneToOneMessageSchema = new mongoose.Schema<IOneToOneMessage>({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: ["Text", "Media", "Document", "Link"],
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now(),
        required: true,
      },
      text: {
        type: String,
      },
      file: {
        type: String,
      },
    },
  ],
});

const OneToOneMessage = mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
export default OneToOneMessage;
