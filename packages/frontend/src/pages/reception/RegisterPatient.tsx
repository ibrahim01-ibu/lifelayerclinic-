import React, { useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Label } from '@radix-ui/react-label';

export default function RegisterPatient() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        phoneNumber: '',
        email: '',
        address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/patients', {
                fullName: `${formData.firstName} ${formData.lastName}`,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                contactNumber: formData.phoneNumber,
                email: formData.email,
                address: formData.address
            });
            alert(`Patient Registered! MRN: ${res.data.data.patient_mrn}`);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Register New Patient</CardTitle>
                    <CardDescription>Enter patient details to create a new record and LifeCard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" placeholder="John" required onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" placeholder="Doe" required onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" required onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    onChange={handleChange}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" name="phoneNumber" placeholder="+91 98765 43210" required onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="123 Street, City" onChange={handleChange} />
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button variant="outline" type="button" onClick={() => navigate('/')}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Patient'}</Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
