import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

// This is a "factory" function. It takes a list of allowed roles and returns a middleware function.
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // CAMERA 6: Did it make it to the Role check?
    console.log("--> ROLE MIDDLEWARE HIT! User Role:", req.user?.role, "| Allowed:", allowedRoles);
    // Safety check: Make sure authenticate middleware ran first
    if (!req.user || !req.user.role) {
      res.status(403).json({ success: false, message: "User role not found." });
      return;
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Forbidden. You do not have permission." });
      return;
    }

    // They have permission! Let them through.
    next();
  };
};