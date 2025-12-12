import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
    const { user } = useAuth();

    // Fetch Doctor's Queue
    const { data: queue, isLoading } = useQuery({
        queryKey: ['queue', 'doctor', user?.id],
        queryFn: async () => {
            // In a real app we'd get the doctor ID from the user object more robustly
            // For now assuming user.id is what we want or we need to look up doctor id
            const res = await api.get(`/appointments/queue`);
            // Filter client side for now if needed, or backend handles it via User context if implemented
            return res.data.data;
        }
    });

    if (isLoading) return <div className="p-8">Loading...</div>;

    const waiting = queue?.filter((q: any) => q.status === 'waiting') || [];
    const inProgress = queue?.filter((q: any) => q.status === 'consulting') || [];
    const completed = queue?.filter((q: any) => q.status === 'completed') || [];

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Waiting</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{waiting.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>In Consultation</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-blue-600">{inProgress.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{completed.length}</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Up Next</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {waiting.map((q: any) => (
                                <div key={q.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium">{q.patient_name}</p>
                                        <p className="text-sm text-gray-500">Queue #{q.queue_position}</p>
                                    </div>
                                    <Button asChild>
                                        <Link to={`/consultation/${q.appointment_id}`}>Start Consultation</Link>
                                    </Button>
                                </div>
                            ))}
                            {waiting.length === 0 && <p className="text-gray-500">No patients waiting.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>In Progress</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {inProgress.map((q: any) => (
                                <div key={q.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium">{q.patient_name}</p>
                                        <p className="text-sm text-gray-500">Started at {new Date(q.updated_at).toLocaleTimeString()}</p>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link to={`/consultation/${q.appointment_id}`}>Resume</Link>
                                    </Button>
                                </div>
                            ))}
                            {inProgress.length === 0 && <p className="text-gray-500">No active consultations.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
