import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ExternalLink, Image as ImageIcon, Zap, TrendingUp, DollarSign, Coins, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, dashboardAPI, getFullUrl } from '../services/api';
import { formatDate, formatNumber, calculateCost, formatUSD, formatINR } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './UserDetail.css';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [filteredGenerations, setFilteredGenerations] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [costSettings, setCostSettings] = useState({ input_cost_per_million: 2, output_cost_per_million: 12, usd_to_inr: 91 });
  const [loading, setLoading] = useState(true);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditReason, setCreditReason] = useState('Admin bonus');
  const [addingCredits, setAddingCredits] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [userDetail, userGens, settings] = await Promise.all([
        usersAPI.getUserDetail(userId),
        usersAPI.getUserGenerations(userId),
        dashboardAPI.getSettings(),
      ]);
      setDetail(userDetail);
      setGenerations(userGens.generations);
      setFilteredGenerations(userGens.generations);
      setCostSettings(settings);
    } catch (error) {
      console.error('Failed to load user detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryFilter === 'all') {
      setFilteredGenerations(generations);
    } else {
      setFilteredGenerations(generations.filter(gen => gen.category === categoryFilter));
    }
  }, [categoryFilter, generations]);

  const toggleStatus = async () => {
    if (!detail || detail.user.role === 'admin') return;
    const newStatus = detail.user.status === 'active' ? 'suspended' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus} this user?`)) {
      try {
        await usersAPI.updateUserStatus(userId, newStatus);
        toast.success(`User ${newStatus} successfully!`);
        loadData();
      } catch (error) {
        toast.error('Failed to update status');
      }
    }
  };

  const handleAddCredits = async () => {
    if (!creditsToAdd || isNaN(creditsToAdd) || parseInt(creditsToAdd) <= 0) {
      toast.error('Please enter a valid number of credits');
      return;
    }

    setAddingCredits(true);
    try {
      const result = await usersAPI.addUserCredits(userId, parseInt(creditsToAdd), creditReason);
      toast.success(`Successfully added ${result.credits_added} credits!`);
      setCreditsModalOpen(false);
      setCreditsToAdd('');
      setCreditReason('Admin bonus');
      loadData(); // Reload user data to show updated credits
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add credits');
    } finally {
      setAddingCredits(false);
    }
  };

  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  if (loading || !detail) {
    return <Loader fullScreen size="lg" />;
  }

  const user = detail.user;
  const stats = detail.generation_stats;
  const costs = calculateCost(stats.total_input_tokens, stats.total_output_tokens, costSettings);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="user-detail-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="profile-card-new">
          <div className="profile-avatar-large">
            <span style={{ fontSize: '48px', fontWeight: '700' }}>
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="profile-info-new">
            <div className="profile-name-row">
              <h2 className="profile-name-large">{user.name}</h2>
              {user.role === 'admin' && <span className="admin-badge-new">Admin</span>}
            </div>
            <p className="profile-email-new">{user.email}</p>
            <div className="profile-meta-row">
              {user.phone && <span className="profile-meta-item">📞 {user.phone}</span>}
              <span className="profile-meta-item">📅 Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
          {user.role !== 'admin' && (
            <Button
              variant={user.status === 'active' ? 'danger' : 'primary'}
              onClick={toggleStatus}
            >
              {user.status === 'active' ? 'Suspend User' : 'Activate User'}
            </Button>
          )}
        </Card>
      </motion.div>

      {/* Credits Section */}
      <h2 className="section-title">Credits & Stats</h2>
      <div className="stats-grid-new">
        <motion.div variants={itemVariants}>
          <Card className="stat-card-new-detail" hoverable onClick={() => setCreditsModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Coins size={24} color="#3B82F6" />
            </div>
            <div className="stat-value-new-detail">{user.credits || 0}</div>
            <div className="stat-label-new-detail">Available Credits</div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Plus size={14} /> Add Credits
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="stat-card-new-detail" hoverable>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <TrendingUp size={24} color="#8B5CF6" />
            </div>
            <div className="stat-value-new-detail">{stats.total_generations}</div>
            <div className="stat-label-new-detail">Generations</div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="stat-card-new-detail" hoverable>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
              <ImageIcon size={24} color="#EC4899" />
            </div>
            <div className="stat-value-new-detail">{stats.total_images}</div>
            <div className="stat-label-new-detail">Images</div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="stat-card-new-detail" hoverable onClick={() => setTokenModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Zap size={24} color="#10B981" />
            </div>
            <div className="stat-value-new-detail">{formatNumber(stats.total_tokens)}</div>
            <div className="stat-label-new-detail">Total Tokens</div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="stat-card-new-detail" hoverable>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <DollarSign size={24} color="#F59E0B" />
            </div>
            <div className="stat-value-new-detail">{formatINR(costs.totalCost, costSettings.usd_to_inr)}</div>
            <div className="stat-label-new-detail">Total Cost</div>
          </Card>
        </motion.div>
      </div>

      {/* Generation History */}
      <div className="history-header">
        <h2 className="section-title">Generation History ({filteredGenerations.length})</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${categoryFilter === 'all' ? 'filter-btn-active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All
          </button>
          {[...new Set(generations.map(g => g.category))].map(category => (
            <button
              key={category}
              className={`filter-btn ${categoryFilter === category ? 'filter-btn-active' : ''}`}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <motion.div 
        className="generations-list"
        variants={containerVariants}
      >
        {filteredGenerations.length === 0 ? (
          <Card>
            <div className="empty-state">
              <ImageIcon size={48} color="var(--color-muted)" />
              <p>No generations found</p>
            </div>
          </Card>
        ) : (
          filteredGenerations.map((gen, index) => {
            const genCosts = calculateCost(gen.input_tokens, gen.output_tokens, costSettings);
            return (
              <motion.div key={gen.id} variants={itemVariants}>
                <Card className="gen-card-new" hoverable>
                <div className="gen-header">
                  <span className="gen-badge">{gen.category}</span>
                  {gen.sub_category && <span className="gen-badge-sub">{gen.sub_category}</span>}
                  <span className="gen-date">{formatDate(gen.created_at)}</span>
                </div>
                <div className="gen-stats-row">
                  <div className="gen-stat-item">
                    <ImageIcon size={16} color="#EC4899" />
                    <span>{gen.total_images} images</span>
                  </div>
                  <div className="gen-stat-item">
                    <Zap size={16} color="#10B981" />
                    <span>{formatNumber(gen.total_tokens)} tokens</span>
                  </div>
                  <div className="gen-stat-item">
                    <DollarSign size={16} color="#F59E0B" />
                    <span>{formatINR(genCosts.totalCost, costSettings.usd_to_inr)}</span>
                  </div>
                </div>
                {gen.result_urls.length > 0 && (
                  <div className="gen-images">
                    {gen.result_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={getFullUrl(url)}
                        alt={`Result ${idx + 1}`}
                        className="gen-thumb"
                        onClick={() => {
                          setSelectedImage(getFullUrl(url));
                          setImageModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Token Modal */}
      <Modal isOpen={tokenModalOpen} onClose={() => setTokenModalOpen(false)} title="Token Breakdown" size="md">
        <div className="token-modal">
          <div className="token-section">
            <h3>Tokens</h3>
            <div className="token-row">
              <span>Input Tokens</span>
              <span>{stats.total_input_tokens.toLocaleString()}</span>
            </div>
            <div className="token-row">
              <span>Output Tokens</span>
              <span>{stats.total_output_tokens.toLocaleString()}</span>
            </div>
            <div className="token-row token-row-total">
              <span><strong>Total Tokens</strong></span>
              <span><strong>{stats.total_tokens.toLocaleString()}</strong></span>
            </div>
          </div>
          <div className="token-section">
            <h3>Cost (USD)</h3>
            <div className="token-row">
              <span>Input (${costSettings.input_cost_per_million} / 1M)</span>
              <span>{formatUSD(costs.inputCost)}</span>
            </div>
            <div className="token-row">
              <span>Output (${costSettings.output_cost_per_million} / 1M)</span>
              <span>{formatUSD(costs.outputCost)}</span>
            </div>
            <div className="token-row token-row-total">
              <span><strong>Total Cost</strong></span>
              <span><strong>{formatUSD(costs.totalCost)}</strong></span>
            </div>
          </div>
          <div className="token-section">
            <h3>Cost (INR) ≈ @₹{costSettings.usd_to_inr}/USD</h3>
            <div className="token-row token-row-total">
              <span><strong>Total Cost</strong></span>
              <span style={{ color: 'var(--color-accent)' }}><strong>{formatINR(costs.totalCost, costSettings.usd_to_inr)}</strong></span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} title="Image Viewer" size="lg">
        <div className="image-viewer">
          <img src={selectedImage} alt="Full size" className="viewer-image" />
          <div className="viewer-actions">
            <Button icon={<Download size={18} />} onClick={() => handleDownloadImage(selectedImage)}>
              Download
            </Button>
            <Button variant="secondary" icon={<ExternalLink size={18} />} onClick={() => window.open(selectedImage, '_blank')}>
              Open in New Tab
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Credits Modal */}
      <Modal isOpen={creditsModalOpen} onClose={() => setCreditsModalOpen(false)} title="Add Credits to User" size="md">
        <div className="credits-modal">
          <div className="current-credits-display">
            <Coins size={32} color="#3B82F6" />
            <div>
              <div style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>Current Balance</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>{user.credits || 0} Credits</div>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '24px' }}>
            <label htmlFor="credits-input" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Credits to Add</label>
            <input
              id="credits-input"
              type="number"
              min="1"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(e.target.value)}
              placeholder="Enter number of credits"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary)'
              }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label htmlFor="reason-input" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Reason (Optional)</label>
            <input
              id="reason-input"
              type="text"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="e.g., Admin bonus, Promotion, etc."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary)'
              }}
            />
          </div>

          {creditsToAdd && parseInt(creditsToAdd) > 0 && (
            <div className="preview-box" style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--color-secondary)', marginBottom: '8px' }}>Preview:</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#3B82F6' }}>
                {user.credits || 0} + {creditsToAdd} = {(user.credits || 0) + parseInt(creditsToAdd)} Credits
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Button
              onClick={handleAddCredits}
              disabled={addingCredits || !creditsToAdd || parseInt(creditsToAdd) <= 0}
              style={{ flex: 1 }}
            >
              {addingCredits ? 'Adding...' : 'Add Credits'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCreditsModalOpen(false)}
              disabled={addingCredits}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default UserDetail;
