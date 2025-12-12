import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, UserPlus, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AppShell = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist'] },
        { name: 'Patients', path: '/patients', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
        { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['admin', 'doctor', 'receptionist'] },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-primary">LifeLayer Clinic</h1>
                    <p className="text-xs text-gray-500">{user?.clinicId ? 'Clinic ID: ' + user.clinicId.substring(0, 8) : ''}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {filteredNav.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.fullName?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{user?.fullName}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};
