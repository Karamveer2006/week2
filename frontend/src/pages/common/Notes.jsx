import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Book, FileText, Download, Trash2, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Notes() {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    description: '',
    file: null
  });

  useEffect(() => {
    fetchNotes();
    if (user?.role === 'teacher') {
      fetchClasses();
    }
  }, [token, user]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, class_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return alert('Please select a file to upload.');

    setIsUploading(true);
    const data = new FormData();
    data.append('class_id', formData.class_id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('file', formData.file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notes`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData({ ...formData, title: '', description: '', file: null });
      fetchNotes();
    } catch (err) {
      console.error('Upload failed', err);
      alert(err.response?.data?.message || 'Failed to upload note');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3">
        <Book className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Study Notes</h1>
      </div>

      {user?.role === 'teacher' && (
        <Card className="border-t-4 border-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              <span>Upload New Note</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Class</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    required
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Title</label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Chapter 1 Slides"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload File (PDF, DOCX, PPT)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300 dark:text-gray-400"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isUploading} className="flex items-center space-x-2">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{isUploading ? 'Uploading...' : 'Upload Note'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
        {notes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <FileText className="h-12 w-12 text-gray-300 mb-2" />
            <p>No study notes available.</p>
          </div>
        ) : (
          notes.map(note => (
            <Card key={note.id} className="flex flex-col hover:border-indigo-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md mb-2 inline-block">
                      {note.subject_code}
                    </span>
                    <CardTitle className="text-lg line-clamp-1" title={note.title}>{note.title}</CardTitle>
                  </div>
                  {user?.role === 'teacher' && (
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete Note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded on {format(new Date(note.created_at), 'MMM d, yyyy')}
                </p>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {note.description || "No description provided."}
                </p>
              </CardContent>
              <CardFooter className="pt-0 border-t border-gray-100 dark:border-gray-800 mt-4">
                <a 
                  href={note.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full mt-4 flex items-center justify-center space-x-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
