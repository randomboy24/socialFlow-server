import express from "express";
import { s3Client } from "./config/s3.js";
import { getDownloadUrl, getUploadUrl } from "./services/s3.service.js";
import cors from "cors";
import nodemailer from "nodemailer";
import { timeStamp } from "node:console";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const otpStore: Record<string, { otp: number; timestamp: number }> = {};

app.post("/get-signed-url", async (req, res) => {
  console.log("post request hit");
  const { filename, filetype, type } = req.body;
  if (!filename || !filetype || !type) {
    return res.status(400).json({
      message: "BAD REQUEST",
    });
  }

  console.log("filename ", filename);
  console.log("filetype ", filetype);
  console.log("type ", type);

  try {
    let url;
    switch (type) {
      case "profile-picture":
        console.log("profile picture case hit");
        url = await getUploadUrl({
          filename: "profile-picture/" + filename,
          contentType: filetype,
        });
        console.log("url ", url);
        break;
      case "post-image":
        console.log("post image case hit");
        url = await getUploadUrl({
          filename: "post-image/" + filename,
          contentType: filetype,
        });
        console.log("url ", url);
        break;
      default:
        return res.status(400).json({
          message: "BAD REQUEST",
        });
    }

    return res.json({
      url,
    });
  } catch (err) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
});

app.get("/get-signed-url", async (req, res) => {
  console.log("get request hit");
  const { key, type } = req.query;
  if (!key || !type) {
    return res.status(400).json({
      message: "BAD REQUEST",
    });
  }

  console.log("key ", key);
  console.log("type ", type);

  try {
    let url: string;

    switch (type) {
      case "profile-picture":
        url = await getDownloadUrl({
          key: "profile-picture/" + key,
        });

        break;

      case "post-image":
        url = await getDownloadUrl({
          key: "post-image/" + key,
        });

        break;
      default:
        return res.status(400).json({
          message: "BAD REQUEST",
        });
    }

    return res.json({
      url,
    });
  } catch (err) {
    console.error("Erorr ", err);
    return res.status(500).json({
      message: "INTERNAL SERVER ERRROR",
    });
  }
});

app.post("/send-otp", async function (req, res) {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({
      message: "BAD REQUEST",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { otp, timestamp: Date.now() };

    await transporter.sendMail({
      from: "jatinthegod212@gmail.com",
      to: email,
      subject: "OTP for socialFlow",
      text: `Your OTP is ${otp}`,
    });

    return res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
});

app.post("/verify-otp", async function (req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      message: "BAD REQUEST",
    });
  }

  try {
    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json({
        message: "OTP not found",
      });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (Date.now() - storedOtp.timestamp > 60000) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    delete otpStore[email];
    return res.json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
});

app.get("/health", (req, res) => {
  return res.json({
    status: "OK",
    uptime: process.uptime(),
    timeStamp: Date.now(),
  });
});

app.listen(PORT, () => {
  console.log("server is listening at port " + PORT);
});
