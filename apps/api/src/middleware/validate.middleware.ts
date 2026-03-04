import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (!result.success) {
        console.error("❌ VALIDATION FAILED for schema!");
        console.error("Data received:", { body: req.body, query: req.query, params: req.params });
        console.error("Zod Issues:", result.error.issues);
        const errorMessages = result.error.issues.map((e: any) => e.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errorMessages,
        });
      }
      
      // Update the request with the validated (and possibly stripped/transformed) data
      const data = result.data as any;
      if (data.body) req.body = data.body;
      if (data.query) Object.assign(req.query, data.query);
      if (data.params) Object.assign(req.params, data.params);
      
      next();
    } catch (error) {
      console.error("🚨 VALIDATE MIDDLEWARE CRASH:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
