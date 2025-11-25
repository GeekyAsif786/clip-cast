import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState("");

    const onSubmit = async (data) => {
        try {
            await login(data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-white">
            <div className="bg-[#1e1e1e] p-8 rounded-xl w-full max-w-md border border-[#303030]">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email or Username</label>
                        <input 
                            {...register("email", { required: "Email or Username is required" })}
                            type="text" 
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

                    <button type="submit" className="bg-[#3ea6ff] text-black font-bold py-2 rounded hover:bg-[#3ea6ff]/90 mt-2">
                        Sign In
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-400">
                    Don't have an account? <Link to="/register" className="text-[#3ea6ff] hover:underline">Sign up</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
