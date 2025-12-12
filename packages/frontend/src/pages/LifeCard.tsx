import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { QrCode } from 'lucide-react';

export default function LifeCard() {
    return (
        <div className="p-8 flex justify-center">
            <Card className="w-[350px] border-primary/20 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-primary">LifeLayer Card</CardTitle>
                    <CardDescription>Universal Health ID</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-inner border">
                        <QrCode className="w-48 h-48 text-gray-800" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-bold text-xl">John Doe</p>
                        <p className="text-gray-500">MRN: LLC-2023-8492</p>
                        <p className="text-xs text-gray-400">DOB: 12 Jan 1985 • Male</p>
                    </div>
                    <div className="w-full pt-4 border-t text-center">
                        <p className="text-xs text-blue-600 font-medium">Scan to access medical records</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
