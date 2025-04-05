import { Hono } from "hono";
import { validator } from "hono/validator";
import { env } from 'hono/adapter'
import { db } from "../db";
import { user } from "../db/schema";
import { otp } from "../db/schema/otp";
import { eq } from "drizzle-orm";
import { sign } from 'hono/jwt';
import { JWT_SECRET } from "../util/constants";
import { createSmsSenderService } from '../core/sms/sender';
import { formatPhoneNumber } from '../util/phoneNumber';

const authRouter = new Hono();

function createOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createOtpExpiry() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes
  return expiresAt;
}

// Login endpoint
authRouter.post(
  "/login",
  validator("json", (value, c) => {
    const { phoneNumber } = value;
    if (!phoneNumber) {
      return c.json({ message: "Phone number is required" }, 400);
    }
    return { phoneNumber };
  }),
  async (c) => {
    const { phoneNumber } = await c.req.json();
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    const existingUser = await db.query.user.findFirst({
      where: eq(user.phoneNumber, formattedPhoneNumber),
    });

    if (!existingUser) {
      return c.json({ message: "User not found" }, 404);
    }

    const [otpRecord] = await db.insert(otp)
      .values({
        userId: existingUser.id,
        code: createOtpCode(),
        expiresAt: createOtpExpiry(),
      })
      .returning({ reference: otp.reference, code: otp.code });

    const { SMS_API_KEY, SMS_BASE_URL, SENDER_MOBILE } = env<{
      SMS_API_KEY: string,
      SENDER_MOBILE: string,
      SMS_BASE_URL: string
    }>(c);

    const smsSender = createSmsSenderService({
      apiKey: SMS_API_KEY,
      defaultSender: SENDER_MOBILE,
      baseUrl: SMS_BASE_URL,
    });

    await smsSender.sendCommandResponse(
      phoneNumber,
      otpRecord.code,
    );

    return c.json({
      message: "OTP sent successfully",
      reference: otpRecord.reference,
    });
  }
);

// OTP resend endpoint
authRouter.post(
  "/otp/resend",
  validator("json", (value, c) => {
    const { reference } = value;
    if (!reference) {
      return c.json({ message: "Invalid reference" }, 400);
    }
    return { reference };
  }),
  async (c) => {
    const { reference } = await c.req.json();

    const otpRecord = await db.query.otp.findFirst({
      where: eq(otp.reference, reference),
    });

    if (!otpRecord) {
      return c.json({ message: "Invalid reference" }, 400);
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, otpRecord.userId),
    });

    if (!userRecord || !userRecord?.phoneNumber) {
      return c.json({ message: "User not found" }, 400);
    }

    const [{ code }] = await db.update(otp)
      .set({
        code: createOtpCode(),  
        expiresAt: createOtpExpiry(),
      })
      .where(eq(otp.id, otpRecord.id))
      .returning({ reference: otp.reference, code: otp.code });
    
    const { SMS_API_KEY, SMS_BASE_URL, SENDER_MOBILE } = env<{
      SMS_API_KEY: string,
      SENDER_MOBILE: string,
      SMS_BASE_URL: string
    }>(c);

    const smsSender = createSmsSenderService({
      apiKey: SMS_API_KEY,
      defaultSender: SENDER_MOBILE,
      baseUrl: SMS_BASE_URL,
    });

    await smsSender.sendCommandResponse(
      userRecord.phoneNumber,
      code,
    );
    
    return c.json({
      message: "OTP sent successfully",
      reference: otpRecord.reference,
    });
  }
);

// Verify endpoint
authRouter.post(
  "/verify",
  validator("json", (value, c) => {
    const { reference, code } = value;
    if (!reference || !code) {
      return c.json({ message: "Reference and code are required" }, 400);
    }
    return { reference, code };
  }),
  async (c) => {
    const { reference, code } = await c.req.json();

    const otpRecord = await db.query.otp.findFirst({
      where: eq(otp.reference, reference),
    });

    if (!otpRecord) {
      return c.json({ message: "Invalid reference" }, 404);
    }

    if (new Date() > otpRecord.expiresAt) {
      await db.delete(otp).where(eq(otp.id, otpRecord.id));

      return c.json({ message: "OTP has expired" }, 400);
    }

    if (otpRecord.code !== code) {
      return c.json({ message: "Invalid code" }, 400);
    }

    await db.delete(otp).where(eq(otp.id, otpRecord.id));

    const token = await sign({
      userId: otpRecord.userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
    }, JWT_SECRET);

    return c.json({
      message: "Successfully verified",
      token,
    });
  }
);

export default authRouter;