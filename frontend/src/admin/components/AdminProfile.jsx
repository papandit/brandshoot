import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Button from './Button';
import Loader from './Loader';
import './AdminProfile.css';

const AdminProfile = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    joinedDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAdminProfile();
    }
  }, [isOpen]);

  const loadAdminProfile = async () => {
    setLoading(true);
    try {
      // Fetch all users and filter for admin role
      const response = await usersAPI.getUsers(1, 100, '');
      console.log('Users response:', response);
      
      // Find user with admin role
      const adminUser = response.users?.find(user => user.role === 'admin');
      
      if (!adminUser) {
        toast.error('Admin user not found');
        setLoading(false);
        return;
      }
      
      setAdminData(adminUser);
      setFormData({
        name: adminUser.name || adminUser.username || 'Admin User',
        email: adminUser.email || '',
        role: adminUser.role || 'Admin',
        joinedDate: adminUser.created_at ? new Date(adminUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'
      });
    } catch (error) {
      console.error('Failed to load admin profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="admin-profile-overlay" onClick={onClose}>
        <motion.div 
          className="admin-profile-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="profile-modal-header">
            <h2 className="profile-modal-title">Admin Profile</h2>
            <button className="profile-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="profile-modal-content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <Loader size="lg" />
              </div>
            ) : (
              <>
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                <User size={48} />
              </div>
              <div className="profile-avatar-info">
                <h3 className="profile-user-name">{formData.name}</h3>
                <span className="profile-user-role">
                  <Shield size={14} />
                  {formData.role}
                </span>
              </div>
            </div>

            {/* Info Cards */}
            <div className="profile-info-grid">
              <div className="profile-info-card">
                <div className="profile-info-icon">
                  <User size={20} color="#8B5CF6" />
                </div>
                <div className="profile-info-content">
                  <label className="profile-info-label">Full Name</label>
                  <p className="profile-info-value">{formData.name}</p>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="profile-info-icon">
                  <Mail size={20} color="#EC4899" />
                </div>
                <div className="profile-info-content">
                  <label className="profile-info-label">Email Address</label>
                  <p className="profile-info-value">{formData.email}</p>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="profile-info-icon">
                  <Shield size={20} color="#10B981" />
                </div>
                <div className="profile-info-content">
                  <label className="profile-info-label">Role</label>
                  <p className="profile-info-value">{formData.role}</p>
                </div>
              </div>

              <div className="profile-info-card">
                <div className="profile-info-icon">
                  <Calendar size={20} color="#F59E0B" />
                </div>
                <div className="profile-info-content">
                  <label className="profile-info-label">Joined</label>
                  <p className="profile-info-value">{formData.joinedDate}</p>
                </div>
              </div>
            </div>
            </>
            )}
          </div>

          {/* Footer */}
          <div className="profile-modal-footer">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminProfile;
