import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowRight,
  BarChart2
} from 'lucide-react';

const AgentDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    high_priority: 0
  });

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder] = useState('desc');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sortField) params.sort = sortField;
      if (sortOrder) params.order = sortOrder;

      const [statsRes, ticketsRes, usersRes] = await Promise.all([
        api.get('/tickets/stats'),
        api.get('/tickets', { params }),
        api.get('/users')
      ]);

      setStats(statsRes.data);
      setTickets(ticketsRes.data);
      setAgents(usersRes.data);
    } catch (err) {
      console.error('Error fetching agent dashboard:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleInlineUpdate = async (ticketId, fields) => {
    try {
      await api.put(`/tickets/${ticketId}`, fields);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update ticket');
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Support Agent Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Overview of support queue, ticket stats, and customer requests
          </p>
        </div>

        <button onClick={fetchDashboardData} className="btn btn-secondary">
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Statistics Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Ticket size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total}</div>
            <div className="stat-lbl">Total Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.open}</div>
            <div className="stat-lbl">Open Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.in_progress}</div>
            <div className="stat-lbl">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.closed}</div>
            <div className="stat-lbl">Resolved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffe4e6', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.high_priority}</div>
            <div className="stat-lbl">High Priority</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Sort */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by subject, description, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '140px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div style={{ width: '140px' }}>
            <select
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-control"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="created_at">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
              <option value="subject">Sort by Subject</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* All Tickets Queue Table */}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <p>Loading support queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card empty-state">
          <Ticket className="empty-icon" size={48} />
          <h3>No support tickets match your filters</h3>
          <p style={{ marginTop: '0.5rem' }}>
            Try adjusting your search criteria or resetting filters.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                      #{ticket.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ticket.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ticket.customer_email}</div>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <Link to={`/tickets/${ticket.id}`} style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {ticket.subject}
                      </Link>
                    </td>
                    <td>
                      <select
                        value={ticket.priority}
                        onChange={(e) => handleInlineUpdate(ticket.id, { priority: e.target.value })}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          border: '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleInlineUpdate(ticket.id, { status: e.target.value })}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="open">open</option>
                        <option value="in_progress">in_progress</option>
                        <option value="closed">closed</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={ticket.assigned_to || ''}
                        onChange={(e) => handleInlineUpdate(ticket.id, { assigned_to: e.target.value ? parseInt(e.target.value, 10) : null })}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          border: '1px solid var(--border)',
                          maxWidth: '130px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Unassigned --</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="btn btn-secondary btn-sm">
                        <span>Details</span>
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
