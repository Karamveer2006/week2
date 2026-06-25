import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function TeacherSchedule() {
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [classId, setClassId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const { token } = useAuth();

  const fetchData = async () => {
    try {
      const [timeRes, classRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes/timetable`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClasses(classRes.data);
      
      const calendarEvents = timeRes.data.map(t => {
        const daysMap = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        
        return {
          id: t.id,
          title: `${t.subject_code} - ${t.class_name} (${t.room_number})`,
          startTime: t.start_time,
          endTime: t.end_time,
          daysOfWeek: [daysMap[t.day_of_week]],
          backgroundColor: '#2563eb',
          extendedProps: {
            class_id: t.class_id,
            room_number: t.room_number,
            day_of_week: t.day_of_week,
            start_time: t.start_time,
            end_time: t.end_time
          }
        };
      });
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAdd = () => {
    setEditId(null);
    setClassId('');
    setDayOfWeek('Monday');
    setStartTime('');
    setEndTime('');
    setRoomNumber('');
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const ev = info.event;
    setEditId(ev.id);
    setClassId(ev.extendedProps.class_id);
    setDayOfWeek(ev.extendedProps.day_of_week);
    setStartTime(ev.extendedProps.start_time);
    setEndTime(ev.extendedProps.end_time);
    setRoomNumber(ev.extendedProps.room_number);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!classId || !dayOfWeek || !startTime || !endTime) return alert("Please fill required fields");

    const payload = { class_id: classId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, room_number: roomNumber };
    try {
      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes/timetable/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes/timetable`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save schedule');
    }
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!window.confirm("Are you sure you want to delete this schedule block?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes/timetable/${editId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Class Schedule Matrix</h1>
        <Button onClick={handleOpenAdd} className="w-full md:w-auto">+ Add Schedule Block</Button>
      </div>
      
      <Card>
        <CardContent className="p-2 md:p-6 overflow-x-auto">
          <div className="h-[700px] min-w-[800px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="100%"
              eventCursor="pointer"
            />
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader title={editId ? "Edit Schedule Block" : "Add Schedule Block"} onClose={() => setIsModalOpen(false)} />
        <ModalBody>
          <form id="scheduleForm" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={classId} onChange={e => setClassId(e.target.value)} required>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Day of Week</label>
              <Select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </Select>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Start Time</label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">End Time</label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Room Number</label>
              <Input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          {editId && (
            <Button variant="outline" className="mr-auto text-red-500 border-red-500 hover:bg-red-50" onClick={handleDelete}>Delete</Button>
          )}
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="scheduleForm">Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
