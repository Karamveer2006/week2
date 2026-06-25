import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';

export default function ClassRoster() {
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [file, setFile] = useState(null);
  const { token } = useAuth();

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [token]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    // Assuming backend POST /api/classes exists. Let's mock it if not.
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, { class_name: className, subject_code: subjectCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClasses();
      setClassName('');
      setSubjectCode('');
    } catch (err) {
      alert('Failed to create class. Make sure the backend supports POST /api/classes.');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedClass) return alert('Select class and file');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('class_id', selectedClass);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/bulk-upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`Success: ${res.data.successCount} students added.`);
      setFile(null);
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Classes & Roster</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Class Name</label>
                <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Intro to React" required />
              </div>
              <div>
                <label className="text-sm font-medium">Subject Code</label>
                <Input value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CS101" required />
              </div>
              <Button type="submit">Create Class</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Onboard Students</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Class</label>
                <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required>
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Upload Roster (Excel/CSV)</label>
                <Input type="file" accept=".csv, .xlsx, .xls" onChange={e => setFile(e.target.files[0])} required />
                <p className="text-xs text-gray-500 mt-1">Requires columns: Name, Email, RollNumber</p>
              </div>
              <Button type="submit" variant="secondary">Upload & Enroll</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? <p className="text-gray-500">No classes found.</p> : (
            <div className="flex gap-4 flex-wrap">
              {classes.map(c => (
                <Badge key={c.id} variant="default" className="text-sm py-2 px-4">{c.subject_code}: {c.class_name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
