import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';


export default function TeacherDashboard() {
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeStudents: 0,
    pendingAssignments: 0,
    avgAttendance: 0,
    attendanceTrends: [],
    gradeDistribution: []
  });
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const { token } = useAuth();

  const fetchData = async () => {
    try {
      const [noticesRes, statsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notices`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/dashboard/teacher/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotices(noticesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notices`, { title: noticeTitle, content: noticeContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsNoticeOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <Button onClick={() => setIsNoticeOpen(true)}>+ Post Notice</Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalClasses}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.activeStudents}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.pendingAssignments}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.avgAttendance}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} name="Present Students" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} name="Absent Students" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Number of Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle>Notice Board</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {notices.length === 0 ? <p className="text-gray-500 text-sm">No notices posted.</p> : notices.map(n => (
              <div key={n.id} className="border-b border-gray-100 pb-3 last:border-0">
                <h4 className="font-semibold text-sm">{n.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{n.content}</p>
                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isNoticeOpen} onClose={() => setIsNoticeOpen(false)}>
        <ModalHeader title="Post Global Notice" onClose={() => setIsNoticeOpen(false)} />
        <ModalBody>
          <form id="noticeForm" onSubmit={handlePostNotice} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700"
                rows="4" 
                value={noticeContent} 
                onChange={e => setNoticeContent(e.target.value)} 
                required
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsNoticeOpen(false)}>Cancel</Button>
          <Button type="submit" form="noticeForm">Post Notice</Button>
        </ModalFooter>
      </Modal>

    </div>
  );
}
