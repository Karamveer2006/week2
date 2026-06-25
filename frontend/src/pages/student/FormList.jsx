import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function FormListStudent() {
  const [forms, setForms] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms();
  }, [token]);

  const fetchForms = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments`, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      setForms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dynamic Forms</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.length === 0 ? (
          <p className="text-gray-500">No forms assigned yet.</p>
        ) : forms.map(f => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{f.subject_code} - {f.class_name}</p>
              <p className="text-sm line-clamp-3 mb-4">{f.description}</p>
              
              {f.marks_awarded !== null ? (
                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 text-center">
                    Score: {parseFloat(f.marks_awarded).toFixed(0)}%
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center mt-4 border-t pt-4 border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 font-medium">Due: {f.due_date ? new Date(f.due_date).toLocaleDateString() : 'No Due Date'}</p>
                  <Button size="sm" onClick={() => navigate(`/student/take-form/${f.id}`)}>Take Assignment</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
