"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [role, setRole] = useState(null); // 'admin' | 'people' | null
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedRole = localStorage.getItem('disaster_role');
        if (savedRole) setRole(savedRole);
        setIsLoading(false);
    }, []);

    const updateRole = (newRole) => {
        setRole(newRole);
        localStorage.setItem('disaster_role', newRole);
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem('disaster_role');
    };

    return (
        <RoleContext.Provider value={{ role, updateRole, logout, isLoading }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
