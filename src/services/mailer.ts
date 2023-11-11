import Mailjet, { LibraryResponse, SendEmailV3_1 } from "node-mailjet";
import dotenv from "dotenv";
dotenv.config();

const mailjet = Mailjet.apiConnect(
  process.env.MAILAPI_KEY || "a",
  process.env.MAILSECRET_KEY || "b"
);

interface MailProps {
  sender: string;
  recepient: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: [];
}

const sendSGMail = async ({
  sender,
  recepient,
  subject,
  html = "",
  text = "",
  attachments,
}: MailProps) => {
  try {
    const from = sender || "mshagun2001@gmail.com";

    const result: LibraryResponse<SendEmailV3_1.Response> = await mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: from,
              Name: "Tawk",
            },
            To: [
              {
                Email: recepient,
                Name: recepient.split("@")[0],
              },
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html,
          },
        ],
      });
    if (result.body.Messages[0].Status !== "success") {
      console.log(result.body.Messages[0].Errors);
    }
  } catch (err) {
    console.log(err);
  }
};

export const sendEmail = async (args: MailProps) => {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve();
  } else {
    return sendSGMail(args);
  }
};
