import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoSearchOutline } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import { HiMenu } from "react-icons/hi";
import { useAuth } from '../context/AuthContext';
import { RiVideoAddLine } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";

function Header({ toggleSidebar }) {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${searchQuery}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        setShowDropdown(false);
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f0f] border-b border-[#272727] flex items-center justify-between px-4 z-50">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-[#272727] rounded-full text-white">
                    <HiMenu size={24} />
                </button>
                <Link to="/" className="flex items-center gap-1">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                    <span className="text-white text-xl font-bold tracking-tighter">ClipCast</span>
                </Link>
            </div>

            <form onSubmit={handleSearch} className="flex-1 max-w-[600px] items-center hidden md:flex">
                <div className="flex w-full">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#121212] border border-[#303030] rounded-l-full px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="bg-[#222222] border border-l-0 border-[#303030] rounded-r-full px-5 py-2 text-white hover:bg-[#303030]">
                        <IoSearchOutline size={20} />
                    </button>
                </div>
            </form>

            <div className="flex items-center gap-3">
                {user ? (
                    <>
                        <Link to="/upload" className="p-2 hover:bg-[#272727] rounded-full text-white">
                            <RiVideoAddLine size={24} />
                        </Link>
                        <div className="relative">
                            <button 
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-8 h-8 rounded-full overflow-hidden border border-[#303030]"
                            >
                                <img 
                                    src={user.avatar} 
                                    alt={user.username} 
                                    className="w-full h-full object-cover"
                                />
                            </button>
                            {showDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#282828] rounded-xl shadow-lg py-2 border border-[#3e3e3e]">
                                    <div className="px-4 py-3 border-b border-[#3e3e3e]">
                                        <p className="text-white font-semibold">{user.fullName}</p>
                                        <p className="text-gray-400 text-sm">@{user.username}</p>
                                    </div>
                                    <Link 
                                        to={`/c/${user.username}`} 
                                        className="block px-4 py-2 text-white hover:bg-[#3e3e3e]"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Your Channel
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-white hover:bg-[#3e3e3e] flex items-center gap-2"
                                    >
                                        <FiLogOut />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="flex items-center gap-2 border border-[#303030] rounded-full px-3 py-1.5 text-[#3ea6ff] hover:bg-[#263850] hover:border-transparent font-medium text-sm">
                        <FaUserCircle size={20} />
                        Sign in
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Header;
