import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, ModalHeader, ModalBody } from '../../components/ui/Modal';

export default function FormListTeacher() {
  const [forms, setForms] = useState([]);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedFormTitle, setSelectedFormTitle] = useState('');
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

  const handleViewSubmissions = async (form) => {
    setSelectedFormTitle(form.title);
    setSubmissionsModalOpen(true);
    setSubmissions([]);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments/${form.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch submissions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dynamic Forms</h1>
        <Button onClick={() => navigate('/teacher/form-builder')}>+ Create New Form</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.length === 0 ? (
          <p className="text-gray-500">No forms created yet.</p>
        ) : forms.map(f => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{f.subject_code} - {f.class_name}</p>
              <p className="text-sm line-clamp-3 mb-4">{f.description}</p>
              <div className="flex justify-between items-center mt-4 border-t pt-4 border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 font-medium">Due: {f.due_date ? new Date(f.due_date).toLocaleDateString() : 'No Due Date'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(f)}>Submissions</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/form-builder/${f.id}`)}>Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={submissionsModalOpen} onClose={() => setSubmissionsModalOpen(false)}>
        <ModalHeader title={`Submissions: ${selectedFormTitle}`} onClose={() => setSubmissionsModalOpen(false)} />
        <ModalBody>
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No submissions yet.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {submissions.map(s => (
                <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-sm text-gray-500">Roll No: {s.roll_number}</p>
                    <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(s.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {s.score_percentage !== null ? (
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-md font-bold dark:bg-green-900/30 dark:text-green-400">
                        {parseFloat(s.score_percentage).toFixed(0)}%
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Not Auto-Graded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
