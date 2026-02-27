import { Request, Response } from "express";
import { registerSchema } from "../utils/validators";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    // 1. Validate the incoming data (req.body) against our Zod rules
    const validatedData = registerSchema.parse(req.body);

    // 2. Hand the safe data to the Service (The Chef)
    const user = await authService.registerUser(validatedData);

    // 3. Send a successful HTTP 201 (Created) response back to the client
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error: any) {
    // If Zod validation fails, it throws an error we can catch here
    if (error.name === "ZodError") {
       res.status(400).json({ success: false, errors: error.errors });
       return;
    }
    
    // Catch-all for other errors (like email already exists)
    res.status(400).json({ success: false, message: error.message });
  }
};
import { loginSchema } from "../utils/validators"; // update your import

// ... your existing register controller ...

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData);

    // Set the refresh token in an HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, // Javascript cannot access this cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Protects against cross-site request forgery (CSRF)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send the user data and access token back
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    // We use 401 Unauthorized for login failures
    res.status(401).json({ success: false, message: error.message });
  }
};
export const logout = (req: Request, res: Response) => {
  // To log someone out, we simply clear the HTTP-Only cookie that holds their Refresh Token
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};
export const refresh = async (req: Request, res: Response) => {
  try {
    // 1. Grab the refresh token from the HTTP-Only cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ success: false, message: "No refresh token provided" });
      return;
    }

    // 2. Hand it to the Service to cook up new tokens
    const { newAccessToken, newRefreshToken } = await authService.refreshUserToken(token);

    // 3. Put the NEW refresh token into the cookie (Rotation)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 4. Send the NEW access token to the frontend
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken: newAccessToken },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};