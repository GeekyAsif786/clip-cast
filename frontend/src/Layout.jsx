import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={isSidebarOpen} />
            <main className={`pt-16 transition-all duration-200 ${isSidebarOpen ? "pl-60" : "pl-[72px]"}`}>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;
