import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

// This is the security guard for your backend routes!
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Grab the Authorization header sent by Axios
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
// CAMERA 5: Did the token actually arrive at the backend?
  console.log("--> AUTH MIDDLEWARE HIT! Header received:", authHeader);
  // 2. Check if it exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided or wrong format.' 
    });
  }

  // 3. Split "Bearer <token>" to just get the <token> part
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);

    // 5. Attach the decoded user info to the request so the controller can use it
    (req as any).user = decoded;

    // 6. Let the user through!
    next();
  } catch (error: any) {
    // CAMERA 4: Why did jwt.verify crash?!
    console.error("JWT VERIFY FAILED:", error.message);
    console.error("SECRET USED:", process.env.JWT_ACCESS_SECRET);

    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.',
      errorDetail: error.message // Sending it to the frontend just to be helpful while debugging
    });
  }
};