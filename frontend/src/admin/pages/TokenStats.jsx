import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter } from 'lucide-react';
import { tokenStatsAPI, dashboardAPI } from '../services/api';
import { formatNumber, calculateCost, formatINR } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import './TokenStats.css';

const FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'Current Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'last_3_months', label: 'Last 3 Months' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'year', label: 'This Year' },
];

const TokenStats = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [costSettings, setCostSettings] = useState({ input_cost_per_million: 2, output_cost_per_million: 12, usd_to_inr: 91 });
  const [loading, setLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, [filter]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        tokenStatsAPI.getTokenStats(filter),
        dashboardAPI.getSettings(),
      ]);
      setStats(data);
      setCostSettings(settings);
    } catch (error) {
      console.error('Failed to load token stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <Loader fullScreen size="lg" />;
  }

  const totalCostUSD = calculateCost(stats.total_input_tokens, stats.total_output_tokens, costSettings).totalCost;

  return (
    <div className="token-stats-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Button variant="secondary" icon={<Filter size={18} />} onClick={() => setFilterModalOpen(true)}>
          {FILTERS.find(f => f.id === filter)?.label || 'All Time'}
        </Button>
      </div>

      {/* Big Stats Card */}
      <Card className="big-stats-card">
        <div className="big-stats-icon gradient-bg">⚡</div>
        <div className="big-stats-value">{formatNumber(stats.total_tokens)}</div>
        <div className="big-stats-label">Total Tokens Used</div>
        <div className="big-stats-cost">
          ≈ ${totalCostUSD.toFixed(4)} • {formatINR(totalCostUSD, costSettings.usd_to_inr)}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="token-stats-grid">
        <Card className="token-stat-card">
          <div className="token-stat-value">{formatNumber(stats.total_generations)}</div>
          <div className="token-stat-label">Generations</div>
        </Card>
        <Card className="token-stat-card">
          <div className="token-stat-value">{formatNumber(stats.total_images)}</div>
          <div className="token-stat-label">Images</div>
        </Card>
        <Card className="token-stat-card">
          <div className="token-stat-value">{formatNumber(stats.total_input_tokens)}</div>
          <div className="token-stat-label">Input Tokens</div>
        </Card>
        <Card className="token-stat-card">
          <div className="token-stat-value">{formatNumber(stats.total_output_tokens)}</div>
          <div className="token-stat-label">Output Tokens</div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <h2 className="section-title">By Category</h2>
      {stats.categories.length === 0 ? (
        <Card><div className="empty-state">No data for this period</div></Card>
      ) : (
        <div className="categories-list">
          {stats.categories.map((cat, idx) => (
            <Card key={idx} className="category-card">
              <div className="category-badge">{cat.category}</div>
              <div className="category-stats">
                <span>{cat.count} gen</span>
                <span>{cat.images} img</span>
                <span>{formatNumber(cat.tokens)} tkns</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pricing Info */}
      <Card className="pricing-card">
        <h3 className="pricing-title">Current Cost Rates</h3>
        <p className="pricing-row">Input: ${costSettings.input_cost_per_million} / 1M tokens</p>
        <p className="pricing-row">Output: ${costSettings.output_cost_per_million} / 1M tokens</p>
        <p className="pricing-row">Exchange Rate: ₹{costSettings.usd_to_inr} / $1</p>
        <p className="pricing-note">Edit rates on Dashboard → Cost Configuration</p>
      </Card>

      {/* Filter Modal */}
      <Modal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Select Filter" size="sm">
        <div className="filter-options">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-option ${filter === f.id ? 'filter-option-active' : ''}`}
              onClick={() => {
                setFilter(f.id);
                setFilterModalOpen(false);
              }}
            >
              <Calendar size={18} />
              <span>{f.label}</span>
              {filter === f.id && <span className="filter-check">✓</span>}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TokenStats;
