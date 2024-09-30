import e, { Request, Response } from "express";
import cors from "cors";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { createTransport, SentMessageInfo } from "nodemailer";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";

const app = e();
const port: number = 3000;

const logWithColor = (message: string, color: string = "\x1b[37m") => {
  console.log(`${color}%s\x1b[0m`, message);
};

// Secret environment variables
const getJWTSECRET = (): string =>
  process.env.JWT_SECRET ??
  ((): never => {
    logWithColor("JWT_SECRET is missing!", "\x1b[31m"); // Red
    throw new Error("PLZ Define JWT Secret");
  })();

const getGmail = (): string =>
  process.env.GMAIL ??
  ((): never => {
    logWithColor("GMAIL is missing!", "\x1b[31m"); // Red
    throw new Error("Mail not defined");
  })();

const getGmailPass = (): string =>
  process.env.GMAIL_PASS ??
  ((): never => {
    logWithColor("GMAIL_PASS is missing!", "\x1b[31m"); // Red
    throw new Error("PLZ GET GMAIL PASSWORD");
  })();

// Middlewares
app.use(e.json());
app.use(
  cors({
    origin: "*",
  }),
);

// Dummy users storage
let dummyusers: { [key: string]: string } = {};

// Clear dummyusers periodically
setInterval(() => {
  logWithColor("Clearing OTP memory", "\x1b[33m"); // Yellow
  dummyusers = {};
}, 3600000); // 1 hour

// Health Check
app.get("/", (req: Request, res: Response) => {
  logWithColor("GET / - Server health check", "\x1b[36m"); // Cyan
  res.json({ message: "Server is running" });
});

// Check if email exists
app.post("/check-email", async (req: Request, res: Response) => {
  logWithColor("POST /check-email - Request received", "\x1b[36m"); // Cyan
  try {
    const { email } = req.body;
    if (!email) {
      logWithColor("Email is required but missing", "\x1b[31m"); // Red
      res.status(400).json({ error: "Email is required" });
      return;
    }

    logWithColor(`Checking if email exists: ${email}`, "\x1b[36m"); // Cyan
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length > 0) {
      logWithColor(`User with email ${email} found`, "\x1b[32m"); // Green
      const nameExists = user[0].name;
      if (nameExists) {
        logWithColor(`User already has a name: ${nameExists}`, "\x1b[33m"); // Yellow
        res.json({ exists: true });
        return;
      } else {
        logWithColor(`User has no name, allowing profile creation`, "\x1b[33m"); // Yellow
        res.json({ exists: false });
        return;
      }
    } else {
      logWithColor(
        `No user with email ${email}, creating new user`,
        "\x1b[36m",
      ); // Cyan
      await db.insert(users).values({
        id: v4(),
        email: email,
      });
      res.json({ exists: false });
    }
  } catch (error) {
    logWithColor(`Error during email check: ${error}`, "\x1b[31m"); // Red
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send OTP
app.post("/send-otp", (req: Request, res: Response) => {
  logWithColor("POST /send-otp - Request received", "\x1b[36m"); // Cyan
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  logWithColor(`Generated OTP for ${email}: ${otp}`, "\x1b[36m"); // Cyan
  dummyusers[email] = otp;

  const mailOptions = {
    from: getGmail(),
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}`,
  };

  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: getGmail(),
      pass: getGmailPass(),
    },
  });

  logWithColor(`Attempting to send OTP to ${email}`, "\x1b[33m"); // Yellow
  transporter.sendMail(
    mailOptions,
    (error: Error | null, info: SentMessageInfo): Response | undefined => {
      if (error) {
        logWithColor(`Error sending OTP to ${email}: ${error}`, "\x1b[31m"); // Red
        return res.status(500).json({ error: "Error sending OTP" });
      } else {
        logWithColor(`OTP sent to ${email}: ${info.response}`, "\x1b[32m"); // Green
        return res.status(200).json({ message: "OTP sent to email" });
      }
    },
  );
});

// Verify OTP
app.post("/verify-otp", (req: Request, res: Response) => {
  logWithColor("POST /verify-otp - Request received", "\x1b[36m"); // Cyan
  const { email, otp } = req.body;
  logWithColor(`Verifying OTP for ${email}`, "\x1b[33m"); // Yellow

  if (dummyusers[email] === otp) {
    logWithColor(`OTP verified for ${email}`, "\x1b[32m"); // Green
    const token = jwt.sign({ email }, getJWTSECRET(), { expiresIn: "1h" });
    logWithColor(`Token generated for ${email}: ${token}`, "\x1b[36m"); // Cyan
    res.status(200).json({ token });
  } else {
    logWithColor(
      `Invalid OTP for ${email}. Provided OTP: ${otp}, Expected OTP: ${dummyusers[email]}`,
      "\x1b[31m", // Red
    );
    res.status(401).json({ error: "Invalid OTP" });
  }
});

// Verify token
app.post("/verify-token", (req: Request, res: Response) => {
  logWithColor("POST /verify-token - Request received", "\x1b[36m"); // Cyan
  const token = req.headers["authorization"]?.split(" ")[1];
  logWithColor(`Received token: ${token}`, "\x1b[33m"); // Yellow

  if (!token) {
    logWithColor("No token provided", "\x1b[31m"); // Red
    res.status(401).json({ error: "Token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJWTSECRET());
    logWithColor(`Token verified, decoded email: ${decoded}`, "\x1b[32m"); // Green
    res.status(200).json({ email: decoded });
  } catch (e) {
    logWithColor(`Token verification failed: ${e}`, "\x1b[31m"); // Red
    res.status(401).json({ error: "Invalid token" });
  }
});

// Create or update user
app.post("/create-user", async (req: Request, res: Response) => {
  logWithColor("POST /create-user - Request received", "\x1b[36m"); // Cyan
  const { user } = req.body;
  logWithColor(`Received user data: ${JSON.stringify(user)}`, "\x1b[33m"); // Yellow

  if (!user || !user.name) {
    logWithColor("User name or data is missing", "\x1b[31m"); // Red
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  try {
    logWithColor(
      `Checking if user with email ${user.email} exists`,
      "\x1b[33m",
    ); // Yellow
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email));

    if (existingUser.length <= 0) {
      logWithColor(`User with email ${user.email} does not exist`, "\x1b[31m"); // Red
      res.status(409).json({ error: "User with this email doesn't exist" });
      return;
    }

    logWithColor(`Updating user details for ${user.email}`, "\x1b[33m"); // Yellow
    console.log(user.religion);
    await db
      .update(users)
      .set({
        name: user.name,
        location: user.location,
        gender: user.gender,
        relationshiptype: user.relationshiptype,
        height: user.height,
        religion: user.religion,
        occupationArea: user.occupationArea,
        occupationField: user.occupationField,
        drink: user.drink,
        smoke: user.smoke,
        bio: user.bio,
        date: user.date,
        month: user.month,
        year: user.year,
      })
      .where(eq(users.email, user.email));

    logWithColor(`User details updated for ${user.email}`, "\x1b[32m"); // Green
    res.status(201).json({ created: true });
  } catch (error) {
    logWithColor(`Error creating/updating user: ${error}`, "\x1b[31m"); // Red
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  logWithColor(`Server listening on port ${port}`, "\x1b[32m"); // Green
});
