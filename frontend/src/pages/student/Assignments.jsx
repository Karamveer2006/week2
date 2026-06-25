import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [submittingId, setSubmittingId] = useState(null);
  const { token } = useAuth();

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [token]);

  const handleUploadClick = (id) => {
    document.getElementById(`upload-${id}`).click();
  };

  const handleFileChange = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setSubmittingId(id);
    const formData = new FormData();
    formData.append('assignment_id', id);
    formData.append('file', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments/submit`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchAssignments();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Assignments</h1>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments found.</p>
        ) : assignments.map(a => (
          <Card key={a.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 shadow-sm">
            <div className="flex-1 mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{a.title}</h3>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{a.subject_code} - {a.class_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{a.description}</p>
              
              {a.file_url && (
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm font-medium mt-3 inline-block">
                  Download Prompt/Resource
                </a>
              )}
              
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Due</span>
                <span className="text-sm text-red-500 font-medium">{new Date(a.due_date).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-3 md:pl-6 md:border-l md:border-gray-100 dark:border-gray-800">
              {a.submission_url ? (
                <>
                  <Badge variant="success" className="px-3 py-1 text-sm">Submitted</Badge>
                  <a href={a.submission_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View My Work</a>
                </>
              ) : (
                <Badge variant="warning" className="px-3 py-1 text-sm">Pending</Badge>
              )}
              
              {a.marks_awarded && (
                <div className="text-right mt-2">
                  <span className="text-xs text-gray-500 block">Grade</span>
                  <span className="font-bold text-2xl text-green-600">{a.marks_awarded} pts</span>
                </div>
              )}

              {!a.submission_url && (
                <div className="mt-2">
                  <input 
                    type="file" 
                    id={`upload-${a.id}`} 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(e, a.id)}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleUploadClick(a.id)}
                    disabled={submittingId === a.id}
                  >
                    {submittingId === a.id ? 'Uploading...' : 'Submit Work (PDF)'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
