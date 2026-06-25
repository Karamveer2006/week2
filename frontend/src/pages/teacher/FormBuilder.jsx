import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, X } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

const FIELD_TYPES = [
  { type: "text", label: "Text", icon: "T" },
  { type: "number", label: "Number", icon: "#" },
  { type: "textarea", label: "Textarea", icon: "¶" },
  { type: "dropdown", label: "Dropdown", icon: "▾" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "radio", label: "Radio", icon: "◉" },
  { type: "date", label: "Date", icon: "📅" },
];

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [classes, setClasses] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    fetchClasses();
    if (id) fetchForm();
  }, [id, token]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data);
      if (res.data.length > 0 && !classId) setClassId(res.data[0].id);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };

  const fetchForm = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTitle(data.title);
      setDescription(data.description || "");
      setHeaderImage(data.header_image || "");
      setClassId(data.class_id);
      setDueDate(data.due_date ? data.due_date.split('T')[0] : "");
      setFormFields(data.fields || []);
    } catch (err) {
      console.error("Failed to load form", err);
      navigate("/teacher/assignments");
    } finally {
      setLoading(false);
    }
  };

  const addField = (type) => {
    const newField = {
      id: uuidv4(),
      type,
      label: "",
      required: false,
      placeholder: "",
      correct_answer: "",
      options: ["checkbox", "radio", "dropdown"].includes(type)
        ? ["Option 1", "Option 2"]
        : [],
    };
    setFormFields((prev) => [...prev, newField]);
  };

  const updateField = (fieldId, key, value) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, [key]: value } : f))
    );
  };

  const updateOption = (fieldId, optionIndex, value) => {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const newOptions = [...f.options];
        newOptions[optionIndex] = value;
        
        // If the old option was the correct answer, update the correct answer to match
        const isCorrectAnswer = f.correct_answer === f.options[optionIndex];
        return { 
            ...f, 
            options: newOptions,
            correct_answer: isCorrectAnswer ? value : f.correct_answer
        };
      })
    );
  };

  const addOption = (fieldId) => {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        return { ...f, options: [...f.options, `Option ${f.options.length + 1}`] };
      })
    );
  };

  const removeOption = (fieldId, optionIndex) => {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const newOptions = f.options.filter((_, i) => i !== optionIndex);
        return { ...f, options: newOptions };
      })
    );
  };

  const deleteField = (fieldId) => {
    setFormFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const moveField = (index, direction) => {
    const newFields = [...formFields];
    const target = index + direction;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setFormFields(newFields);
  };

  const handleSave = async () => {
    if (!title.trim() || !classId) return alert("Title and Class are required.");
    if (formFields.length === 0) return alert("Add at least one field.");
    const emptyLabels = formFields.filter((f) => !f.label.trim());
    if (emptyLabels.length > 0) return alert("All fields must have a label.");

    setSaving(true);
    try {
      const payload = { 
          class_id: classId, 
          title, 
          description, 
          header_image: headerImage, 
          fields: formFields,
          due_date: dueDate || null
      };

      if (id) {
        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments/${id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/form-assignments`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate("/teacher/assignments");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save form.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading form...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {id ? "Edit Dynamic Form" : "Create Dynamic Form"}
          </h1>
          <p className="text-gray-500 mt-1">Build auto-grading assignments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/teacher/assignments")} className="flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Settings & Palette */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Settings</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Class *</label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.subject_code} - {c.class_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Title *</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Add Fields</h2>
              <div className="grid grid-cols-2 gap-3">
                {FIELD_TYPES.map((ft) => (
                  <button
                    key={ft.type}
                    onClick={() => addField(ft.type)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-slate-700"
                  >
                    <span className="text-xl">{ft.icon}</span>
                    <span className="text-xs font-medium">{ft.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Form Canvas */}
        <div className="lg:col-span-2 space-y-4">
          {formFields.length === 0 ? (
            <Card className="border-dashed border-2 bg-gray-50 dark:bg-slate-800/50">
              <CardContent className="p-16 flex flex-col items-center text-gray-500">
                <p>Click a field type on the left to start building your form</p>
              </CardContent>
            </Card>
          ) : (
            formFields.map((field, index) => (
              <Card key={field.id} className="border-l-4 border-l-indigo-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">{index + 1}</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">{field.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveField(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                      <button onClick={() => moveField(index, 1)} disabled={index === formFields.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                      <button onClick={() => deleteField(field.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question / Label</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        value={field.label}
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                      />
                    </div>

                    {["dropdown", "checkbox", "radio"].includes(field.type) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                        <div className="space-y-2 mt-2">
                          {field.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                className="block w-full rounded-md border border-gray-300 py-1.5 px-3 shadow-sm focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={opt}
                                onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                              />
                              {field.options.length > 1 && (
                                <button onClick={() => removeOption(field.id, optIdx)} className="text-red-400 hover:text-red-600">
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addOption(field.id)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mt-2">
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <label className="text-sm font-semibold text-green-600 dark:text-green-400">Auto-Grade: Correct Answer (Optional)</label>
                      <p className="text-xs text-gray-500 mb-2">If provided, this question will be automatically graded.</p>
                      
                      {["dropdown", "checkbox", "radio"].includes(field.type) ? (
                        <select
                          className="block w-full rounded-md border border-green-300 bg-green-50 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none sm:text-sm dark:border-green-800 dark:bg-green-900/20 dark:text-white"
                          value={field.correct_answer || ""}
                          onChange={(e) => updateField(field.id, "correct_answer", e.target.value)}
                        >
                          <option value="">-- No correct answer (ungraded) --</option>
                          {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Type exact correct answer..."
                          className="block w-full rounded-md border border-green-300 bg-green-50 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none sm:text-sm dark:border-green-800 dark:bg-green-900/20 dark:text-white"
                          value={field.correct_answer || ""}
                          onChange={(e) => updateField(field.id, "correct_answer", e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
