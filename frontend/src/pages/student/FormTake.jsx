import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default function FormTake() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setForm(data);

        const initial = {};
        if (data.fields) {
            let fields = data.fields;
            if (typeof fields === 'string') fields = JSON.parse(fields);
            
            fields.forEach((field) => {
                if (field.type === "checkbox") {
                    initial[field.id] = [];
                } else {
                    initial[field.id] = "";
                }
            });
        }
        setAnswers(initial);
      } catch (err) {
        setError(err.response?.data?.message || "Assignment not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id, token]);

  const handleChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxToggle = (fieldId, option) => {
    setAnswers((prev) => {
      const current = prev[fieldId] || [];
      if (current.includes(option)) {
        return { ...prev, [fieldId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [fieldId]: [...current, option] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let fields = form.fields;
    if (typeof fields === 'string') fields = JSON.parse(fields);

    const missing = fields
      .filter((f) => f.required)
      .filter((f) => {
        const val = answers[f.id];
        if (val === undefined || val === null || val === "") return true;
        if (Array.isArray(val) && val.length === 0) return true;
        return false;
      });

    if (missing.length > 0) {
      alert(`Please fill required field: "${missing[0].label}"`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments/${id}/submit`, { answers }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setScore(res.data.score);
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = answers[field.id];

    switch (field.type) {
      case "text":
        return <input type="text" className="w-full rounded border-gray-300 p-2 border" placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case "number":
        return <input type="number" className="w-full rounded border-gray-300 p-2 border" placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case "textarea":
        return <textarea className="w-full rounded border-gray-300 p-2 border" rows={4} placeholder={field.placeholder} value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case "date":
        return <input type="date" className="w-full rounded border-gray-300 p-2 border" value={value} onChange={(e) => handleChange(field.id, e.target.value)} />;
      case "dropdown":
        return (
          <select className="w-full rounded border-gray-300 p-2 border" value={value} onChange={(e) => handleChange(field.id, e.target.value)}>
            <option value="">Select an option…</option>
            {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-indigo-50">
                <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={(e) => handleChange(field.id, e.target.value)} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-indigo-50">
                <input type="checkbox" checked={(value || []).includes(opt)} onChange={() => handleCheckboxToggle(field.id, opt)} className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      default:
        return <p className="text-red-500">Unknown field type: {field.type}</p>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading assignment...</div>;
  if (error || !form) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Assignment Submitted!</h2>
        <p className="text-gray-500 mb-6">Your responses have been saved successfully.</p>
        
        {score !== null && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 w-full max-w-sm text-center">
                <p className="text-sm text-green-700 font-semibold mb-1">Auto-Graded Score</p>
                <p className="text-4xl font-bold text-green-600">{parseFloat(score).toFixed(0)}%</p>
            </div>
        )}
        
        <Button onClick={() => navigate("/student/dynamic-forms")}>Back to Assignments</Button>
      </div>
    );
  }

  let fields = form.fields;
  if (typeof fields === 'string') fields = JSON.parse(fields);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {form.header_image && (
        <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-md">
          <img src={form.header_image} alt="Header" className="w-full h-full object-cover" />
        </div>
      )}

      <Card className="mb-6 border-t-4 border-t-indigo-500">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
          {form.description && <p className="text-gray-500">{form.description}</p>}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <Card key={field.id} className="p-6">
            <label className="block text-base font-medium text-gray-800 mb-3">
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </Card>
        ))}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
