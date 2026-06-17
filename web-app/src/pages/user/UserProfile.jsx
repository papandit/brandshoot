// Web port of mobile UserProfileScreen.tsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoSaveOutline,
  IoLogOutOutline,
  IoCheckmarkCircle,
  IoAlertCircle,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { fetchMyProfile, updateMyProfile } from '../../services/api';
import '../pages.css';
import './user.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UserProfile() {
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        phone: phone.trim(),
        profile_picture: profile?.profile_picture || null,
      });
      setProfile(updated);
      updateUser({ name: updated.name, phone: updated.phone });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-flow">
        <AppHeader title="My Profile" />
        <div className="page-loader">
          <span className="spinner" />
        </div>
      </div>
    );
  }

  const isActive = profile?.status !== 'suspended';

  return (
    <div className="page-flow">
      <AppHeader title="My Profile" />
      <div className="flow-content">
        {/* Avatar card */}
        <div className="profile-card">
          <div className="profile-avatar">{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div className="profile-name">{profile?.name}</div>
          <div className="profile-email">{profile?.email}</div>
          <span className={`status-badge ${isActive ? 'active' : 'suspended'}`}>
            {isActive ? <IoCheckmarkCircle /> : <IoAlertCircle />}
            {isActive ? 'Active' : 'Suspended'}
          </span>
        </div>

        {/* Account details */}
        <div className="details-card">
          <h3>Account Details</h3>

          <div className="detail-row">
            <IoPersonOutline />
            <div className="dr-content">
              <div className="dr-label">Full Name</div>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="detail-row">
            <IoMailOutline />
            <div className="dr-content">
              <div className="dr-label">Email</div>
              <div className="dr-value">{profile?.email}</div>
            </div>
          </div>

          <div className="detail-row">
            <IoCallOutline />
            <div className="dr-content">
              <div className="dr-label">Phone</div>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="detail-row">
            <IoCalendarOutline />
            <div className="dr-content">
              <div className="dr-label">Member Since</div>
              <div className="dr-value">{formatDate(profile?.created_at)}</div>
            </div>
          </div>
        </div>

        <button className="app-button primary" disabled={saving} onClick={handleSave}>
          <IoSaveOutline /> {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button className="logout-btn" onClick={logout}>
          <IoLogOutOutline /> Log Out
        </button>
      </div>
    </div>
  );
}
