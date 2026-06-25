import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function StudentSchedule() {
  const [events, setEvents] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes/timetable`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const calendarEvents = res.data.map(t => {
          const daysMap = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
          };
          
          return {
            title: `${t.subject_code} - ${t.class_name} (${t.room_number})`,
            startTime: t.start_time,
            endTime: t.end_time,
            daysOfWeek: [daysMap[t.day_of_week]],
            backgroundColor: '#10b981'
          };
        });
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching timetable:', error);
      }
    };
    fetchTimetable();
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Schedule</h1>
      
      <Card>
        <CardContent className="p-2 md:p-6 overflow-x-auto">
          <div className="h-[700px] min-w-[800px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={events}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="100%"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
