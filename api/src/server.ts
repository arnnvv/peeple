import e, { Request, Response } from "express";
import cors from "cors";
import { db } from "../lib/db";
import { pictures, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { createTransport, SentMessageInfo } from "nodemailer";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
import chalk from 'chalk';  // Import chalk for colored logs
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

app.post("/get-user-from-token", async (req: Request, res: Response) => {
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
    //@ts-expect-error: h i o
    const email = decoded.email;
    console.log(email);
    const userr = await db.select().from(users).where(eq(users.email, email));
    const user = userr[0];
    console.log(user);
    console.log("before image call");
    const imagess = await db
      .select()
      .from(pictures)
      .where(eq(pictures.email, email));
    console.log("after Image call");
    const images = imagess.map(
      (i: { id: number; email: string; url: string }): string => i.url,
    );
    console.log(images);
    res.json({ user, images });
  } catch (e) {
    logWithColor(`Token verification failed: ${e}`, "\x1b[31m"); // Red
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/user-form-email", async (req: Request, res: Response) => {
  console.log("Android req Received");
  const { email } = req.body;
  console.log(req.body, "HI");
  try {
    console.log("try");
    const user = (
      await db.select().from(users).where(eq(users.email, email))
    )[0];
    const images = await db
      .select()
      .from(pictures)
      .where(eq(pictures.email, email));
    console.log(user, images);
    res.json({ user, images });
  } catch (e) {
    logWithColor(`${e}`, "\x1b[31m"); // Red
    res.status(401).json({ error: e });
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
        instaId: user.instaId,
        phone: user.phone,
      })
      .where(eq(users.email, user.email));

    logWithColor(`User details updated for ${user.email}`, "\x1b[32m"); // Green
    res.status(201).json({ created: true });
  } catch (error) {
    logWithColor(`Error creating/updating user: ${error}`, "\x1b[31m"); // Red
    res.status(500).json({ error: "Internal server error" });
  }
});





// 

app.post('/profile-images', async (req: Request, res: Response) => {
  const { email, url } = req.body;
  console.log(`email ki behen ki chut ${email}`);
  // Log incoming request body
  console.log(chalk.blue('Received POST request for /profile-images with the following data:'));
  console.log(chalk.blue(JSON.stringify(req.body, null, 2)));

  // Field validation logging
  if (!email || !url) {
    console.log(chalk.yellow('Missing fields in request body:'));
    if (!email) console.log(chalk.yellow('Missing email'));
    if (!url) console.log(chalk.yellow('Missing URL'));

    res.status(400).json({ error: 'All fields are required' });
  }

  try {
    console.log(chalk.green('Inserting new image into the database...'));

    // Insert new image record
    const newImage = await db.insert(pictures).values({
      email,
      url,

    });

    console.log(chalk.green('Image inserted successfully into the database'));
    console.log(chalk.green('Inserted image details:'));
    console.log(chalk.green(JSON.stringify(newImage, null, 2)));

    // Send success response
    res.status(201).json({ message: 'Image uploaded successfully', newImage });

    // Log the success response
    console.log(chalk.green('Sent 201 response to client: Image uploaded successfully'));

  } catch (error) {
    console.error(chalk.red('Error occurred while inserting image into the database:'));
    console.error(chalk.red(error));

    // Send error response
    res.status(500).json({ error: 'Failed to upload image' });

    // Log the error response
    console.log(chalk.red('Sent 500 response to client: Failed to upload image'));
  }
});

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


// POST route for uploading image to S3
app.post('/upload-image', async (req, res) => {
  const { filename } = req.body;

  logWithColor(`🚀 Starting the upload process for image: "${filename}"`, "\x1b[34m"); // Blue

  try {
    logWithColor(`📦 Preparing to upload the image to S3 with filename: "${filename}"`, "\x1b[34m"); // Blue

    const command = new PutObjectCommand({
      Bucket: "peeple",
      Key: `uploads/${filename}`,
      ContentType: "image/jpeg",
    });

    logWithColor(`🔗 Generating a signed URL for the image upload...`, "\x1b[34m"); // Blue

    try {
      const uploadUrl = await getSignedUrl(s3, command);
      logWithColor(`✅ Successfully generated the upload URL for "${filename}":\n${uploadUrl}`, "\x1b[35m"); // Magenta

      res.status(200).json({ message: 'Upload URL generated successfully', uploadUrl });
    } catch (error: any) {
      logWithColor(`❌ Failed to generate upload URL for "${filename}". Error: ${error.message}`, "\x1b[31m"); // Red
      res.status(500).json({ error: 'Error generating signed URL', details: error.message });
    }
  } catch (error: any) {
    logWithColor(`❌ Something went wrong during the upload initiation for "${filename}". Error: ${error.message}`, "\x1b[31m"); // Red
    res.status(500).json({ error: 'Failed to initiate image upload', details: error.message });
  }
});

// POST route for generating image viewing URL
app.post('/generate-url', async (req, res) => {
  const { filename } = req.body;

  logWithColor(`🔍 Received a request to generate a viewing URL for the image: "${filename}"`, "\x1b[36m"); // Cyan

  if (!filename) {
    logWithColor('❌ No filename was provided in the request.', "\x1b[31m"); // Red
    res.status(400).json({ error: 'Filename is required' });
  }

  try {
    const getObjectURL = async (key: string) => {
      logWithColor(`🌐 Generating signed URL for image key: "${key}"`, "\x1b[36m"); // Cyan

      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: "peeple",
          Key: key,
        }));
        logWithColor(`🔗 Successfully generated viewing URL for "${filename}":\n${url}`, "\x1b[35m"); // Magenta
        return url;
      } catch (error: any) {
        logWithColor(`❌ Error occurred while generating viewing URL for "${filename}": ${error.message}`, "\x1b[31m"); // Red
        throw error;
      }
    };

    const key = `uploads/${filename}`;
    const url = await getObjectURL(key);

    logWithColor(`✅ Viewing URL generation for "${filename}" is complete.`, "\x1b[35m"); // Magenta
    res.json({ filename, url });

  } catch (error: any) {
    logWithColor(`❌ Failed to generate viewing URL for "${filename}". Error: ${error.message}`, "\x1b[31m"); // Red
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

app.post('checkPlan', async (req: Request, res: Response) => {
  console.log("bhaiya req ja rhi hai ")
  const { email } = req.body;
  try {
    const user = await db.select().from(users).where(eq(users.email, email));
    if (user[0].subscription === "basic") {
      res.json({ hasBasicPlan: true });
    } else {
      res.json({ hasBasicPlan: false });
    }
  } catch (e) {
    throw new Error(`${e}`);
  }
});

app.post('updateUserPlan', async (req: Request, res: Response) => {
  const { email, plan } = req.body;

  const togglePlan = (currentPlan: string) => {
    return currentPlan === 'basic' ? 'premium' : 'basic';
  };

  try {
    const newPlan = togglePlan(plan); // Toggle the plan
    await db
      .update(users)
      .set({
        subscription: newPlan,
      })
      .where(eq(users.email, email));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }

});

app.listen(port, () => {
  logWithColor(`Server listening on port ${port}`, "\x1b[32m"); // Green
});


