import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// TypeScript needs to know that we are adding a 'user' property to the standard Express Request
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Look for the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Access denied. No token provided." });
      return;
    }

    // 2. Extract the token (split "Bearer <token>" by the space and take the second part)
    const token = authHeader.split(" ")[1];
    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);

    // 4. Attach the decoded user payload (id and role) to the request object
    req.user = decoded;

    // 5. Tell Express to move on to the next function (the Controller)
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};