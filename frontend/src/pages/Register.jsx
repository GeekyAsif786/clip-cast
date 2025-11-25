import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';

function Register() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState("");

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append("fullName", data.fullName);
            formData.append("email", data.email);
            formData.append("username", data.username);
            formData.append("password", data.password);
            formData.append("avatar", data.avatar[0]);
            if (data.coverImage[0]) {
                formData.append("coverImage", data.coverImage[0]);
            }

            await registerUser(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-white py-10">
            <div className="bg-[#1e1e1e] p-8 rounded-xl w-full max-w-md border border-[#303030]">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input 
                            {...register("fullName", { required: "Full Name is required" })}
                            type="text" 
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                        {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input 
                            {...register("username", { required: "Username is required" })}
                            type="text" 
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                        {errors.username && <span className="text-red-500 text-xs">{errors.username.message}</span>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            {...register("email", { required: "Email is required" })}
                            type="email" 
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input 
                            {...register("password", { required: "Password is required" })}
                            type="password" 
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Avatar</label>
                        <input 
                            {...register("avatar", { required: "Avatar is required" })}
                            type="file" 
                            accept="image/*"
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                        {errors.avatar && <span className="text-red-500 text-xs">{errors.avatar.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Cover Image (Optional)</label>
                        <input 
                            {...register("coverImage")}
                            type="file" 
                            accept="image/*"
                            className="w-full bg-[#0f0f0f] border border-[#303030] rounded p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button type="submit" className="bg-[#3ea6ff] text-black font-bold py-2 rounded hover:bg-[#3ea6ff]/90 mt-2">
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-[#3ea6ff] hover:underline">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
