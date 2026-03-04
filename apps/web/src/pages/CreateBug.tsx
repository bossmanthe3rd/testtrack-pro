import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBug, uploadAttachment } from '../services/bugApi';

// 1. Define the validation rules for the frontend
const bugSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  stepsToReproduce: z.string().min(1, 'Steps are required'),
  expectedBehavior: z.string().min(1, 'Expected behavior is required'),
  actualBehavior: z.string().min(1, 'Actual behavior is required'),
  severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  environment: z.string().min(1, 'Environment is required'),
  affectedVersion: z.string().min(1, 'Version is required'),
});

// Extract the TypeScript type from the Zod schema
type BugFormData = z.infer<typeof bugSchema>;

export default function CreateBug() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 2. Initialize React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<BugFormData>({
    resolver: zodResolver(bugSchema),
  });

  // 3. Handle the file upload instantly when a user selects a file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        const file = e.target.files[0];
        const url = await uploadAttachment(file);
        setAttachmentUrl(url); // Save the Cloudinary URL in state
        alert("File uploaded successfully!");
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload file.");
      } finally {
        setUploading(false);
      }
    }
  };

  // 4. Handle the final form submission
  const onSubmit = async (data: BugFormData) => {
    setIsSubmitting(true);
    try {
      // Combine the form text data with the uploaded file URL (if any)
      const finalPayload = {
        ...data,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      };
      
      await createBug(finalPayload);
      alert("Bug reported successfully!");
      // Here you would normally redirect the user back to the bug list
    } catch (error) {
      console.error(error);
      alert("Failed to create bug.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Report a New Bug</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input {...register('title')} className="w-full border p-2 rounded mt-1" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea {...register('description')} className="w-full border p-2 rounded mt-1" rows={3} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        {/* Dropdowns for Severity & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Severity</label>
            <select {...register('severity')} className="w-full border p-2 rounded mt-1">
              <option value="BLOCKER">Blocker</option>
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
              <option value="TRIVIAL">Trivial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select {...register('priority')} className="w-full border p-2 rounded mt-1">
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
            </select>
          </div>
        </div>

        {/* Additional Text Areas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Steps to Reproduce</label>
            <textarea {...register('stepsToReproduce')} className="w-full border p-2 rounded mt-1" rows={3} />
            {errors.stepsToReproduce && <p className="text-red-500 text-sm">{errors.stepsToReproduce.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Environment (e.g., Chrome 120, Win 11)</label>
            <textarea {...register('environment')} className="w-full border p-2 rounded mt-1" rows={3} />
            {errors.environment && <p className="text-red-500 text-sm">{errors.environment.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Expected Behavior</label>
            <textarea {...register('expectedBehavior')} className="w-full border p-2 rounded mt-1" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium">Actual Behavior</label>
            <textarea {...register('actualBehavior')} className="w-full border p-2 rounded mt-1" rows={2} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Affected Version</label>
          <input {...register('affectedVersion')} className="w-full border p-2 rounded mt-1" />
        </div>

        {/* File Upload section */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">Upload Attachment (Screenshot/Logs)</label>
          <input type="file" onChange={handleFileChange} disabled={uploading} />
          {uploading && <span className="text-blue-500 text-sm ml-2">Uploading to cloud...</span>}
          {attachmentUrl && <span className="text-green-500 text-sm ml-2">✓ Uploaded</span>}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Create Bug Report'}
        </button>
      </form>
    </div>
  );
}