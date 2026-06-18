import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, X, User as UserIcon } from 'lucide-react';
import { usersAPI } from '../services/api';
import { formatDate, debounce } from '../utils/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import './Users.css';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers(1, search);
  }, []);

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      loadUsers(1, search);
    }, 300);
    debouncedSearch();
  }, [search]);

  const loadUsers = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const data = await usersAPI.getUsers(p, 20, s);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} ${user.name}?`)) {
      try {
        await usersAPI.updateUserStatus(user.id, newStatus);
        loadUsers(page);
      } catch (error) {
        alert('Failed to update status');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="users-container">
      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className="result-count">
          <UserIcon size={16} />
          <span>{total} users found</span>
        </div>
      </div>

      {loading ? (
        <div className="users-loading">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          <motion.div 
            className="users-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {users.length === 0 ? (
              <Card>
                <div className="empty-state">
                  <UserIcon size={48} color="var(--color-muted)" />
                  <p>No users found</p>
                </div>
              </Card>
            ) : (
              users.map((user, index) => (
                <motion.div key={user.id} variants={itemVariants}>
                  <Card className="user-card" hoverable onClick={() => navigate(`/users/${user.id}`)}>
                    <div className="user-row">
                      <div className="user-avatar" style={{ backgroundColor: user.role === 'admin' ? 'var(--color-accent-light)' : 'var(--color-surface-elevated)' }}>
                        <span style={{ color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--color-black)', fontSize: '18px', fontWeight: '700' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="user-info">
                        <div className="user-name-row">
                          <span className="user-name">{user.name}</span>
                          {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                        </div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-meta">
                          {user.phone && `📞 ${user.phone} • `}
                          Joined {formatDate(user.created_at)}
                        </div>
                      </div>

                      {user.role !== 'admin' && (
                        <button
                          className={`status-btn ${user.status === 'active' ? 'status-active' : 'status-suspended'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(user);
                          }}
                        >
                          {user.status === 'active' ? '✓ Active' : '⊗ Suspended'}
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => loadUsers(page - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="page-text">Page {page} of {totalPages}</span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => loadUsers(page + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
