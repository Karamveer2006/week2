import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Lock, Save, Mail, Key } from 'lucide-react';

export default function Profile() {
  const { token, user } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState({ name: '', email: '', roll_number: '', role: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  
  // Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMessage({ 
        text: err.response?.data?.message || 'Failed to update profile', 
        type: 'error' 
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordMessage({ text: 'New passwords do not match!', type: 'error' });
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage({ 
        text: err.response?.data?.message || 'Failed to change password', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Account Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Profile Card */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize dark:bg-indigo-900 dark:text-indigo-200">
                    {profile.role || 'User'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <Input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({ ...profile, name: e.target.value })} 
                  disabled={!isEditingProfile}
                  required 
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <Input 
                  type="email" 
                  value={profile.email} 
                  onChange={e => setProfile({ ...profile, email: e.target.value })} 
                  disabled={!isEditingProfile}
                  required 
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {profile.role === 'student' ? 'Roll Number' : 'Employee ID / Reference'}
                </label>
                <Input 
                  type="text" 
                  value={profile.roll_number} 
                  onChange={e => setProfile({ ...profile, roll_number: e.target.value })} 
                  disabled={!isEditingProfile}
                  className="mt-1"
                />
              </div>

              {profileMessage.text && (
                <div className={`p-3 rounded-md text-sm ${profileMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                {!isEditingProfile ? (
                  <Button type="button" onClick={() => setIsEditingProfile(true)} variant="outline">Edit Profile</Button>
                ) : (
                  <>
                    <Button type="button" variant="ghost" onClick={() => { setIsEditingProfile(false); fetchProfile(); }}>Cancel</Button>
                    <Button type="submit" className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="h-full border-t-4 border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-amber-500" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <Input 
                  type="password" 
                  value={passwordData.currentPassword} 
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                  required 
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <Input 
                  type="password" 
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                  required 
                  className="mt-1"
                  minLength={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                  required 
                  className="mt-1"
                  minLength={6}
                />
              </div>

              {passwordMessage.text && (
                <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="secondary" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Update Password</span>
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
