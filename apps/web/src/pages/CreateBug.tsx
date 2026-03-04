import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createBug, uploadAttachment } from '../services/bugApi';
// 🟢 NEW: Import your Axios instance so we can fetch the dropdown data
import { api } from '../features/auth/api';

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
  
  // 🟢 NEW: Add the optional IDs for assignment and linking
  assignedToId: z.string().optional(),
  linkedTestCaseId: z.string().optional(),
});

// Extract the TypeScript type from the Zod schema
type BugFormData = z.infer<typeof bugSchema>;

export default function CreateBug() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🟢 NEW: States to hold the fetched data for the dropdowns
  const [developers, setDevelopers] = useState<{id: string, name: string}[]>([]);
  const [testCases, setTestCases] = useState<{id: string, testCaseId: string, title: string}[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 2. Initialize React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm<BugFormData>({
    resolver: zodResolver(bugSchema),
  });

  // 🟢 NEW: Fetch Developers and Test Cases when the page loads
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsLoadingData(true);
        // Fetch Developers
        const devResponse = await api.get('/api/bugs/developers/list');
        setDevelopers(devResponse.data.data);

        // Fetch Test Cases
        const tcResponse = await api.get('/api/test-cases');
        // Handle pagination structure just in case your backend wraps it in a 'data' object
        const tcData = Array.isArray(tcResponse.data.data) 
          ? tcResponse.data.data 
          : tcResponse.data.data?.data || [];
        setTestCases(tcData);
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);

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
      // 🟢 NEW: We convert empty strings ("") to undefined so Prisma doesn't crash
      const finalPayload = {
        ...data,
        assignedToId: data.assignedToId === "" ? undefined : data.assignedToId,
        linkedTestCaseId: data.linkedTestCaseId === "" ? undefined : data.linkedTestCaseId,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      };
      
      await createBug(finalPayload);
      alert("Bug reported successfully!");
      
      // 🟢 NEW: Redirect back to the Bug Tracker list
      navigate('/bugs');
    } catch (error) {
      console.error(error);
      alert("Failed to create bug.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <div className="mt-20 text-center text-gray-500">Loading form data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10 mb-10">
      <h1 className="text-2xl font-bold mb-6">Report a New Bug</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 🟢 NEW: Assignment & Linking Dropdowns */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-blue-900">Assign to Developer</label>
            <select {...register('assignedToId')} className="w-full border p-2 rounded mt-1 bg-white">
              <option value="">-- Leave Unassigned --</option>
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-blue-900">Link to Test Case</label>
            <select {...register('linkedTestCaseId')} className="w-full border p-2 rounded mt-1 bg-white">
              <option value="">-- Standalone Bug --</option>
              {testCases.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.testCaseId} - {tc.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title *</label>
          <input {...register('title')} className="w-full border p-2 rounded mt-1" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description *</label>
          <textarea {...register('description')} className="w-full border p-2 rounded mt-1" rows={3} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        {/* Dropdowns for Severity & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Severity *</label>
            <select {...register('severity')} className="w-full border p-2 rounded mt-1">
              <option value="BLOCKER">Blocker</option>
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
              <option value="TRIVIAL">Trivial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Priority *</label>
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
            <label className="block text-sm font-medium">Steps to Reproduce *</label>
            <textarea {...register('stepsToReproduce')} className="w-full border p-2 rounded mt-1" rows={3} />
            {errors.stepsToReproduce && <p className="text-red-500 text-sm">{errors.stepsToReproduce.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Environment (e.g., Chrome 120, Win 11) *</label>
            <textarea {...register('environment')} className="w-full border p-2 rounded mt-1" rows={3} />
            {errors.environment && <p className="text-red-500 text-sm">{errors.environment.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-700">Expected Behavior *</label>
            <textarea {...register('expectedBehavior')} className="w-full border-green-300 bg-green-50 p-2 rounded mt-1" rows={2} />
            {errors.expectedBehavior && <p className="text-red-500 text-sm">{errors.expectedBehavior.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-red-700">Actual Behavior *</label>
            <textarea {...register('actualBehavior')} className="w-full border-red-300 bg-red-50 p-2 rounded mt-1" rows={2} />
            {errors.actualBehavior && <p className="text-red-500 text-sm">{errors.actualBehavior.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Affected Version *</label>
          <input {...register('affectedVersion')} className="w-full md:w-1/2 border p-2 rounded mt-1" />
          {errors.affectedVersion && <p className="text-red-500 text-sm">{errors.affectedVersion.message}</p>}
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
          className="w-full bg-blue-600 text-white p-3 font-bold rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Create Bug Report'}
        </button>
      </form>
    </div>
  );
}