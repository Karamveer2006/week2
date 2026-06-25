import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [marks, setMarks] = useState({});
  const { token } = useAuth();

  // Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    try {
      const [asgRes, classRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAssignments(asgRes.data);
      setClasses(classRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedClass || !title || !dueDate || !file) return alert('Please fill required fields and attach a PDF.');

    const formData = new FormData();
    formData.append('class_id', selectedClass);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    formData.append('file', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to create assignment');
    }
  };

  const handleViewSubmissions = async (assignmentId) => {
    setSubmissionsModalOpen(true);
    setSubmissions([]);
    setMarks({});
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(res.data);
      const initialMarks = {};
      res.data.forEach(s => {
        initialMarks[s.id] = s.marks_awarded || '';
      });
      setMarks(initialMarks);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch submissions');
    }
  };

  const handleMarkChange = (submissionId, value) => {
    setMarks({ ...marks, [submissionId]: value });
  };

  const handleSaveMark = async (submissionId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/assignments/submissions/${submissionId}/mark`, {
        marks: marks[submissionId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Mark saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save mark');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Assignments</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Create Assignment</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.length === 0 ? (
          <p className="text-gray-500">No assignments created yet.</p>
        ) : assignments.map(a => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{a.subject_code} - {a.class_name}</p>
              <p className="text-sm line-clamp-3">{a.description}</p>
              {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm block mt-2">View Attachment PDF</a>}
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-gray-400 font-medium">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(a.id)}>View Submissions</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader title="Create Assignment" onClose={() => setIsModalOpen(false)} />
        <ModalBody>
          <form id="createAsg" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required>
                <option value="">-- Choose --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="w-full flex rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-gray-700 dark:text-white"
                rows="3" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Attachment (PDF)</label>
              <Input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} required />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="createAsg">Create</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={submissionsModalOpen} onClose={() => setSubmissionsModalOpen(false)}>
        <ModalHeader title="Student Submissions" onClose={() => setSubmissionsModalOpen(false)} />
        <ModalBody>
          {submissions.length === 0 ? (
            <p className="text-gray-500">No submissions yet.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {submissions.map(s => (
                <div key={s.id} className="p-4 border rounded-md flex justify-between items-center dark:border-gray-700">
                  <div>
                    <p className="font-bold">{s.name} ({s.roll_number})</p>
                    <a href={s.file_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">View Submission PDF</a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      className="w-20" 
                      placeholder="Marks" 
                      value={marks[s.id] || ''} 
                      onChange={e => handleMarkChange(s.id, e.target.value)} 
                    />
                    <Button size="sm" onClick={() => handleSaveMark(s.id)}>Save</Button>
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
