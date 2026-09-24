import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { PlusCircle, Search, RefreshCw, Ticket, ArrowRight } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/tickets', { params });
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.error || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;

  return (
    <div>
      {/* Header Banner */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Hello, {user?.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track and manage your submitted support tickets
          </p>
        </div>

        <Link to="/tickets/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Create New Ticket</span>
        </Link>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '150px', marginBottom: 0, padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Tickets</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tickets.length}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', marginBottom: 0, padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Open</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>{openCount}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', marginBottom: 0, padding: '1rem', borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Progress</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>{inProgressCount}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', marginBottom: 0, padding: '1rem', borderLeft: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{closedCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by subject or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '150px' }}>
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

          <div style={{ width: '150px' }}>
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

          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
            <span>Search</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
            }}
            title="Reset Filters"
          >
            <RefreshCw size={16} />
          </button>
        </form>
      </div>

      {/* Ticket List Table */}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <p>Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card empty-state">
          <Ticket className="empty-icon" size={48} />
          <h3>No support tickets found</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
            {search || statusFilter || priorityFilter
              ? 'Try clearing your filters or search terms.'
              : "You haven't submitted any support tickets yet."}
          </p>
          <Link to="/tickets/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Submit Your First Ticket</span>
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created Date</th>
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
                      <Link to={`/tickets/${ticket.id}`} style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {ticket.subject}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                        {ticket.description.length > 70 ? ticket.description.substring(0, 70) + '...' : ticket.description}
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="btn btn-secondary btn-sm">
                        <span>View</span>
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

export default CustomerDashboard;
