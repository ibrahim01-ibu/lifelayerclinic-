import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';

import Login from './pages/Login';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import RegisterPatient from './pages/reception/RegisterPatient';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ConsultationView from './pages/doctor/ConsultationView';
import AdminDashboard from './pages/admin/AdminDashboard';
import LifeCard from './pages/LifeCard';

// Pages (Placeholders for now)
const Patients = () => <div className="p-8"><h1>Patients List</h1></div>;
const Appointments = () => <div className="p-8"><h1>Appointments</h1></div>;

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;

    return <>{children}</>;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <AppShell />
                            </ProtectedRoute>
                        }>
                            <Route index element={<ReceptionDashboard />} />
                            <Route path="patients/new" element={<RegisterPatient />} />
                            <Route path="doctor" element={<DoctorDashboard />} />
                            <Route path="consultation/:id" element={<ConsultationView />} />
                            <Route path="admin" element={<AdminDashboard />} />
                            <Route path="lifecard" element={<LifeCard />} />
                            <Route path="patients" element={<Patients />} />
                            <Route path="appointments" element={<Appointments />} />
                            <Route path="*" element={<div>Not Found</div>} />
                        </Route>
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
