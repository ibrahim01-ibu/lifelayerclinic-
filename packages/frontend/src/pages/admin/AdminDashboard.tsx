import React from 'react';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const res = await api.get('/analytics/dashboard');
            return res.data.data;
        }
    });

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Revenue Today</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">₹{stats?.revenueToday || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Appointments Today</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats?.appointmentsToday || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>New Patients</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats?.newPatientsToday || 0}</div></CardContent>
                </Card>
            </div>

            <Card className="h-[400px]">
                <CardHeader><CardTitle>Analytics Overview</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center text-gray-400">
                        Chart Placeholder (Recharts installed but needs data structure)
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
