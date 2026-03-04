import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Multer will attach the uploaded file to req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Create a stream to upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "testtrack_bugs", // Organizes files in your Cloudinary dashboard
        resource_type: "auto", // Automatically detects if it's an image, video, or raw file
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ success: false, message: "Upload failed" });
        }
        
        // Return the secure URL to the frontend
        res.status(200).json({ 
          success: true, 
          url: result?.secure_url 
        });
      }
    );

    // Convert the file buffer in memory into a stream and pipe it to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};