import jwt, { JwtPayload } from "jsonwebtoken";
import { getJWTSECRET } from "../src/server";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const getEmail = (token: string | undefined): string | undefined => {
  if (token) {
    console.log("ARnav");
    try {
      const decoded = jwt.verify(token, getJWTSECRET());
      console.log("in try");
      //@ts-expect-error: W T F
      return decoded.email as string;
    } catch (e) {
      console.error(e);
      throw new Error(`${e}`);
    }
  } else {
    console.error("Token not defined");
  }
};

export const getGender = async (
  email: string | undefined,
): Promise<string | undefined> => {
  if (email) {
    try {
      const gender = await db
        .select({
          gender: users.gender,
        })
        .from(users)
        .where(eq(users.email, email));
      const onluGender: string | null = gender[0].gender;
      if (onluGender) return onluGender;
    } catch (e) {
      console.error(e);
      throw new Error(`${e}`);
    }
  } else {
    console.error("No email");
  }
};

export const getReccomendations = async (email: string | undefined) => {
  if (email) {
    const gender: string | undefined = await getGender(email);
    if (gender) {
      let reccomendation;
      if (gender === "male") {
        reccomendation = await db
          .select()
          .from(users)
          .where(eq(users.gender, "female"));
      } else if (gender === "female") {
        reccomendation = await db
          .select()
          .from(users)
          .where(eq(users.gender, "male"));
      }
      return reccomendation;
    } else {
      console.error("gender not defined");
    }
  } else {
    console.error("token not defined");
  }
};
