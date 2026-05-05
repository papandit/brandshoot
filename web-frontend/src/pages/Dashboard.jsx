import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Image, 
  TrendingUp, 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Repeat,
  Activity,
  Zap,
  Server,
  Globe,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../services/api';
import { formatNumber } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import './Dashboard.css';

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [costSettings, setCostSettings] = useState({
    input_cost_per_million: 2,
    output_cost_per_million: 12,
    usd_to_inr: 91,
    per_image_cost: 10,
  });
  const [appConfig, setAppConfig] = useState({
    backend_url: '',
    app_name: 'Brand Shoot AI',
    maintenance_mode: false,
    min_app_version: '1.0.0',
  });
  const [editSettings, setEditSettings] = useState({});
  const [editAppConfig, setEditAppConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAppConfig, setSavingAppConfig] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashData, settings, config] = await Promise.all([
        dashboardAPI.getDashboard(),
        dashboardAPI.getSettings(),
        dashboardAPI.getAppConfig(),
      ]);
      setStats(dashData);
      setCostSettings(settings);
      setEditSettings(settings);
      setAppConfig(config);
      setEditAppConfig(config);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await dashboardAPI.updateSettings(editSettings);
      setCostSettings(editSettings);
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppConfig = async () => {
    setSavingAppConfig(true);
    try {
      await dashboardAPI.updateAppConfig(editAppConfig);
      setAppConfig(editAppConfig);
      toast.success('App configuration updated successfully!');
    } catch (error) {
      toast.error('Failed to update app configuration');
    } finally {
      setSavingAppConfig(false);
    }
  };

  if (loading) {
    return <Loader fullScreen size="lg" />;
  }

  // Use real data from backend (with fallback to show current totals)
  const userGrowthData = stats?.user_growth || [
    { month: 'Total', users: stats?.users?.total || 0 }
  ];

  const tokenUsageData = stats?.token_usage_weekly || [
    { day: 'Total', tokens: stats?.tokens?.total_tokens || 0 }
  ];

  // For category distribution, use generations data or create a simple total view
  const categoryDistribution = stats?.generations?.by_category 
    ? Object.entries(stats.generations.by_category).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value
      }))
    : [
        { name: 'This Month', value: stats?.generations?.this_month || 0 },
        { name: 'Total', value: stats?.generations?.total || 0 }
      ];

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
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Overview */}
      <section className="dashboard-section">
        <h2 className="section-title">Overview</h2>
        <div className="stats-grid">
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Users />} 
              label="Total Users" 
              value={stats?.users?.total || 0} 
              change={stats?.users?.new_this_week ? `+${stats.users.new_this_week} this week` : null}
              color="#8B5CF6" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Image />} 
              label="Total Generations" 
              value={stats?.generations?.total || 0} 
              change={stats?.generations?.this_month ? `${stats.generations.this_month} this month` : null}
              color="#EC4899" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Zap />} 
              label="Total Tokens" 
              value={formatNumber(stats?.tokens?.total_tokens || 0)} 
              change={stats?.tokens?.total_images ? `${stats.tokens.total_images} images` : null}
              color="#10B981" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Activity />} 
              label="Active Users" 
              value={stats?.users?.active || 0} 
              change={stats?.users?.suspended !== undefined ? `${stats.users.suspended} suspended` : null}
              color="#F59E0B" 
            />
          </motion.div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="dashboard-section">
        <div className="charts-grid">
          {/* User Growth Chart */}
          <motion.div variants={itemVariants}>
            <Card className="chart-card">
              <h3 className="chart-title">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Token Usage Chart */}
          <motion.div variants={itemVariants}>
            <Card className="chart-card">
              <h3 className="chart-title">Token Usage (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tokenUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Category Distribution & Token Breakdown */}
      <section className="dashboard-section">
        <div className="charts-grid-2">
          {/* Category Pie Chart */}
          <motion.div variants={itemVariants}>
            <Card className="chart-card">
              <h3 className="chart-title">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Token Breakdown */}
          <motion.div variants={itemVariants}>
            <Card className="token-breakdown-card">
              <h3 className="chart-title">Token Breakdown</h3>
              <div className="token-stats">
                <div className="token-stat-item">
                  <div className="token-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <ArrowUpCircle size={24} color="#8B5CF6" />
                  </div>
                  <div className="token-stat-info">
                    <div className="token-stat-label">Input Tokens</div>
                    <div className="token-stat-value">{formatNumber(stats?.tokens?.total_input_tokens || 0)}</div>
                  </div>
                </div>
                <div className="token-stat-item">
                  <div className="token-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                    <ArrowDownCircle size={24} color="#EC4899" />
                  </div>
                  <div className="token-stat-info">
                    <div className="token-stat-label">Output Tokens</div>
                    <div className="token-stat-value">{formatNumber(stats?.tokens?.total_output_tokens || 0)}</div>
                  </div>
                </div>
                <div className="token-stat-item">
                  <div className="token-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <Repeat size={24} color="#10B981" />
                  </div>
                  <div className="token-stat-info">
                    <div className="token-stat-label">Total Tokens</div>
                    <div className="token-stat-value">{formatNumber(stats?.tokens?.total_tokens || 0)}</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Cost Settings */}
      <section className="dashboard-section">
        <h2 className="section-title">Cost Configuration</h2>
        <motion.div variants={itemVariants}>
          <Card className="settings-card">
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-label">
                  <DollarSign size={16} color="#8B5CF6" />
                  <span>Input Cost (per M tokens)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="setting-input"
                  value={editSettings.input_cost_per_million || 2}
                  onChange={(e) => setEditSettings({ ...editSettings, input_cost_per_million: parseFloat(e.target.value) })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <DollarSign size={16} color="#EC4899" />
                  <span>Output Cost (per M tokens)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="setting-input"
                  value={editSettings.output_cost_per_million || 12}
                  onChange={(e) => setEditSettings({ ...editSettings, output_cost_per_million: parseFloat(e.target.value) })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <Repeat size={16} color="#10B981" />
                  <span>USD to INR Rate</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="setting-input"
                  value={editSettings.usd_to_inr || 91}
                  onChange={(e) => setEditSettings({ ...editSettings, usd_to_inr: parseFloat(e.target.value) })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <DollarSign size={16} color="#10B981" />
                  <span>Per Image Cost (₹)</span>
                </div>
                <input
                  type="number"
                  step="1"
                  className="setting-input"
                  value={editSettings.per_image_cost || 10}
                  onChange={(e) => setEditSettings({ ...editSettings, per_image_cost: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={saving}
              onClick={handleSaveSettings}
              style={{ marginTop: '16px' }}
            >
              Save Settings
            </Button>
          </Card>
        </motion.div>
      </section>

      {/* App Configuration */}
      <section className="dashboard-section">
        <h2 className="section-title">App Configuration</h2>
        <motion.div variants={itemVariants}>
          <Card className="settings-card">
            <div className="settings-grid">
              <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
                <div className="setting-label">
                  <Server size={16} color="#8B5CF6" />
                  <span>Backend URL</span>
                </div>
                <input
                  type="text"
                  className="setting-input"
                  placeholder="http://your-server-ip:port"
                  value={editAppConfig.backend_url || ''}
                  onChange={(e) => setEditAppConfig({ ...editAppConfig, backend_url: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <Globe size={16} color="#10B981" />
                  <span>App Name</span>
                </div>
                <input
                  type="text"
                  className="setting-input"
                  value={editAppConfig.app_name || 'Brand Shoot AI'}
                  onChange={(e) => setEditAppConfig({ ...editAppConfig, app_name: e.target.value })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <Smartphone size={16} color="#F59E0B" />
                  <span>Min App Version</span>
                </div>
                <input
                  type="text"
                  className="setting-input"
                  placeholder="1.0.0"
                  value={editAppConfig.min_app_version || '1.0.0'}
                  onChange={(e) => setEditAppConfig({ ...editAppConfig, min_app_version: e.target.value })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-label">
                  <AlertTriangle size={16} color="#EF4444" />
                  <span>Maintenance Mode</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={editAppConfig.maintenance_mode || false}
                    onChange={(e) => setEditAppConfig({ ...editAppConfig, maintenance_mode: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={savingAppConfig}
              onClick={handleSaveAppConfig}
              style={{ marginTop: '16px' }}
            >
              Save App Configuration
            </Button>
          </Card>
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Quick Actions</h2>
          <span className="keyboard-hint">💡 Click any card to navigate</span>
        </div>
        <motion.div className="actions-grid" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <ActionCard
              title="Manage Users"
              subtitle="View & edit all users"
              onClick={() => navigate('/users')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ActionCard
              title="Token Analytics"
              subtitle="Usage breakdown"
              onClick={() => navigate('/token-stats')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ActionCard
              title="Categories"
              subtitle="Jewelry, Fashion, etc."
              onClick={() => navigate('/categories')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ActionCard
              title="App Models"
              subtitle="AI Characters"
              onClick={() => navigate('/models')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ActionCard
              title="Backgrounds"
              subtitle="Branding backgrounds"
              onClick={() => navigate('/backgrounds')}
            />
          </motion.div>
        </motion.div>
      </section>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, change, color }) => (
  <Card className="stat-card-new" hoverable>
    <div className="stat-card-header">
      <div className="stat-icon-new" style={{ backgroundColor: `${color}15` }}>
        {icon && <div style={{ color }}>{icon}</div>}
      </div>
      {change && (
        <div className="stat-change" style={{ color: change.startsWith('+') ? '#10B981' : '#EF4444' }}>
          {change}
        </div>
      )}
    </div>
    <div className="stat-value-new">{formatNumber(value)}</div>
    <div className="stat-label-new">{label}</div>
  </Card>
);

const ActionCard = ({ title, subtitle, onClick }) => (
  <Card className="action-card-new" hoverable onClick={onClick}>
    <div className="action-title-new">{title}</div>
    <div className="action-subtitle-new">{subtitle}</div>
    <div className="action-arrow">→</div>
  </Card>
);

export default Dashboard;
