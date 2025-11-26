import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { publishVideo } from '../api/video';
import { useNavigate } from 'react-router-dom';
import { ImSpinner2 } from "react-icons/im";

function UploadVideo() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description);
            formData.append("videoFile", data.videoFile[0]);
            formData.append("thumbnail", data.thumbnail[0]);

            await publishVideo(formData);
            navigate('/');
        } catch (err) {
            console.error("Error uploading video:", err);
            setError("Failed to upload video");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-[#1e1e1e] rounded-xl border border-[#303030]">
            <h2 className="text-2xl font-bold mb-6">Upload Video</h2>
            {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Video File</label>
                    <input 
                        {...register("videoFile", { required: "Video file is required" })}
                        type="file" 
                        accept="video/*"
                        className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                    />
                    {errors.videoFile && <span className="text-red-500 text-xs">{errors.videoFile.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Thumbnail</label>
                    <input 
                        {...register("thumbnail", { required: "Thumbnail is required" })}
                        type="file" 
                        accept="image/*"
                        className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                    />
                    {errors.thumbnail && <span className="text-red-500 text-xs">{errors.thumbnail.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input 
                        {...register("title", { required: "Title is required" })}
                        type="text" 
                        className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                    />
                    {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                        {...register("description", { required: "Description is required" })}
                        rows="4"
                        className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                    {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                </div>

                <button 
                    type="submit" 
                    disabled={uploading}
                    className="bg-[#3ea6ff] text-black font-bold py-2 rounded hover:bg-[#3ea6ff]/90 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {uploading && <ImSpinner2 className="animate-spin" />}
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </form>
        </div>
    );
}

export default UploadVideo;
