import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

export default function ManualAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
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

  const fetchAttendance = async () => {
    if (!selectedClass || !date) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/sheet?classId=${selectedClass}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedClass, date, token]);

  const toggleAttendance = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    
    // Optimistic UI update
    setStudents(prev => prev.map(s => 
      s.student_id === studentId ? { ...s, status: newStatus, marked_by: 'Manual' } : s
    ));

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/attendance/manual`, {
        classId: selectedClass,
        date,
        studentId,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Revert if error
      fetchAttendance();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manual Attendance</h1>
        <div className="flex items-center gap-4">
          <Select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-48"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>
            ))}
          </Select>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marked By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No students found.</TableCell>
                  </TableRow>
                ) : students.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.roll_number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'Present' ? 'success' : 'danger'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.marked_by ? (
                        <span className="text-xs text-gray-500">{student.marked_by}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => toggleAttendance(student.student_id, student.status)}
                        className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                          student.status === 'Present' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30'
                        }`}
                      >
                        Mark {student.status === 'Present' ? 'Absent' : 'Present'}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
