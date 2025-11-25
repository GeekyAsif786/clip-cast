import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GoHome, GoHomeFill } from "react-icons/go";
import { MdOutlineVideoLibrary, MdVideoLibrary } from "react-icons/md";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaRegUser, FaUser } from "react-icons/fa";
import { RiHistoryLine, RiHistoryFill } from "react-icons/ri";
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen }) {
    const location = useLocation();
    const { user } = useAuth();

    const sidebarItems = [
        {
            name: 'Home',
            path: '/',
            icon: <GoHome size={24} />,
            activeIcon: <GoHomeFill size={24} />
        },
        {
            name: 'History',
            path: '/history',
            icon: <RiHistoryLine size={24} />,
            activeIcon: <RiHistoryFill size={24} />
        },
        {
            name: 'Liked Videos',
            path: '/liked-videos',
            icon: <BiLike size={24} />,
            activeIcon: <BiSolidLike size={24} />
        },
        {
            name: 'My Content',
            path: user ? `/c/${user.username}` : '/login',
            icon: <MdOutlineVideoLibrary size={24} />,
            activeIcon: <MdVideoLibrary size={24} />
        },
        {
            name: 'Subscribers',
            path: '/subscribers',
            icon: <FaRegUser size={20} />,
            activeIcon: <FaUser size={20} />
        }
    ];

    return (
        <aside className={`fixed left-0 top-16 bottom-0 bg-[#0f0f0f] z-40 overflow-y-auto transition-all duration-200 ${isOpen ? "w-60" : "w-[72px]"}`}>
            <div className="flex flex-col p-2">
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-4 px-3 py-2 rounded-lg mb-1 hover:bg-[#272727] ${isActive ? "bg-[#272727]" : ""}`}
                        >
                            <div className="text-white">
                                {isActive ? item.activeIcon : item.icon}
                            </div>
                            <span className={`text-white text-sm ${isOpen ? "block" : "hidden"} truncate`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}

export default Sidebar;
