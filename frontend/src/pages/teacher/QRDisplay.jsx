import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';

export default function QRDisplay() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const { token } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(res.data);
        if (res.data.length > 0) {
          setSelectedClass(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      }
    };
    fetchClasses();
  }, [token]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchQR = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/qr/${selectedClass}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQrToken(res.data.token);
        setTimeLeft(res.data.expiresIn);
      } catch (err) {
        console.error('Failed to fetch QR');
      }
    };

    fetchQR();
    const interval = setInterval(() => {
      fetchQR();
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, [selectedClass, token]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, qrToken]);

  return (
    <div className="space-y-6 flex flex-col items-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Live Attendance QR</CardTitle>
          <CardDescription>Project this on the screen for students to scan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {classes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">You have not created any classes yet.</p>
              <p className="text-sm text-gray-400">Please create a class before generating attendance QR codes.</p>
            </div>
          ) : (
            <>
              <div className="w-full">
                <label className="text-sm font-medium mb-1 block">Select Class</label>
                <Select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>
                  ))}
                </Select>
              </div>

              {qrToken ? (
                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 flex items-center justify-center">
                  <QRCodeSVG value={qrToken} size={300} level="L" includeMargin={true} />
                </div>
              ) : (
                <div className="h-64 w-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                  <span className="text-gray-400">Generating...</span>
                </div>
              )}

              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-500">Refreshing in</span>
                <span className={`text-4xl font-mono font-bold ${timeLeft < 5 ? 'text-red-500' : 'text-blue-600'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
