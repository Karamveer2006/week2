import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const attendanceData = [
  { name: 'Attended', value: 38 },
  { name: 'Missed', value: 4 },
];
const COLORS = ['#2563eb', '#ef4444'];



export default function StudentDashboard() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([
    { name: 'Attended', value: 0 },
    { name: 'Missed', value: 0 },
  ]);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [gradeHistory, setGradeHistory] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticesRes, statsRes, gradesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notices`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/student/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments/student/grades`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setNotices(noticesRes.data);
        setGradeHistory(gradesRes.data);
        
        const attended = statsRes.data.attended;
        const missed = statsRes.data.missed;
        const total = attended + missed;
        
        setAttendanceStats([
          { name: 'Attended', value: attended },
          { name: 'Missed', value: missed },
        ]);
        
        setAttendancePercentage(total === 0 ? 0 : Math.round((attended / total) * 100));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Student Dashboard</h1>
      
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <Card className="col-span-1 flex flex-col justify-between bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="text-indigo-600 dark:text-indigo-400">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {attendanceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{attendancePercentage}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-4 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">Target: 75%</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
          <CardHeader>
            <CardTitle>Grade History</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeHistory} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" fill="url(#colorScore)" radius={[0, 6, 6, 0]} barSize={24} />
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 border-t-4 border-indigo-500 shadow-lg">
          <CardHeader>
            <CardTitle>Mark Attendance (QR)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
            <p className="text-center text-sm text-gray-500">Scan your teacher's dynamic QR code to mark attendance for the current session securely.</p>
            <button 
              onClick={() => navigate('/student/qr')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors shadow-md text-lg font-medium"
            >
              Open QR Scanner
            </button>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle>Notice Board</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {notices.length === 0 ? <p className="text-gray-500 text-sm">No notices.</p> : notices.map(n => (
              <div key={n.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm">{n.title}</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{n.teacher_name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{n.content}</p>
                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
