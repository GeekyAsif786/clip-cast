import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await getCurrentUser();
                setUser(response.data.data);
            } catch (err) {
                console.log("Not authenticated");
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (data) => {
        const response = await loginUser(data);
        setUser(response.data.data.user);
        return response;
    };

    const register = async (data) => {
        const response = await registerUser(data);
        setUser(response.data.data);
        return response;
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
