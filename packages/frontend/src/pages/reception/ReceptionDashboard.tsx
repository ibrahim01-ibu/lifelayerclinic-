import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReceptionDashboard() {
    const queryClient = useQueryClient();

    // Fetch Appointments
    const { data: appointments, isLoading: appLoading } = useQuery({
        queryKey: ['appointments', 'today'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const res = await api.get(`/appointments?date=${today}`);
            return res.data.data;
        }
    });

    // Fetch Queue
    const { data: queue, isLoading: queueLoading } = useQuery({
        queryKey: ['queue', 'today'],
        queryFn: async () => {
            const res = await api.get('/appointments/queue'); // Assuming this endpoint gives today's queue
            return res.data.data;
        }
    });

    // Check-In Mutation
    const checkInMutation = useMutation({
        mutationFn: async (appointmentId: string) => {
            return api.put(`/appointments/${appointmentId}/check-in`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        }
    });

    if (appLoading || queueLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Reception Dashboard</h1>
                <Button asChild>
                    <Link to="/patients/new">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register New Patient
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waiting in Queue</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{queue?.filter((q: any) => q.status === 'waiting').length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{queue?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Upcoming Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appointments?.filter((a: any) => a.status === 'scheduled').map((appt: any) => (
                                <div key={appt.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium">{appt.patient_name}</p>
                                        <p className="text-sm text-gray-500">{appt.appointment_time} - Dr. {appt.doctor_user_id}</p>
                                    </div>
                                    <Button size="sm" onClick={() => checkInMutation.mutate(appt.id)}>
                                        Check In
                                    </Button>
                                </div>
                            ))}
                            {appointments?.filter((a: any) => a.status === 'scheduled').length === 0 && (
                                <p className="text-sm text-gray-500">No scheduled appointments remaining.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Current Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {queue?.map((q: any) => (
                                <div key={q.id} className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg font-bold bg-blue-100 text-blue-800 w-8 h-8 flex items-center justify-center rounded-full">
                                            {q.queue_position}
                                        </span>
                                        <div>
                                            <p className="font-medium">{q.patient_name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{q.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {queue?.length === 0 && (
                                <p className="text-sm text-gray-500">Queue is empty.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
