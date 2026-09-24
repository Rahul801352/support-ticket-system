import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Clock,
  Settings,
  CheckCircle2,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment Form State
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Agent Management Form State
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const isAgent = user?.role === 'agent';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [ticketRes, commentsRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`)
      ]);

      setTicket(ticketRes.data);
      setComments(commentsRes.data);

      setStatus(ticketRes.data.status);
      setPriority(ticketRes.data.priority);
      setAssignedTo(ticketRes.data.assigned_to || '');

      if (isAgent) {
        const usersRes = await api.get('/users');
        setAgents(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
      const errStatus = err.response?.status;
      if (errStatus === 403) {
        setError('Forbidden: You do not have access to view this ticket.');
      } else if (errStatus === 404) {
        setError('Ticket not found.');
      } else {
        setError(err.response?.data?.error || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isAgent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/tickets/${id}/comments`, { comment: newComment.trim() });
      setComments(prev => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAgentUpdate = async (e) => {
    e.preventDefault();
    setUpdateSuccess('');

    try {
      setUpdatingAgent(true);
      await api.put(`/tickets/${id}`, {
        status,
        priority,
        assigned_to: assignedTo ? parseInt(assignedTo, 10) : null
      });

      setUpdateSuccess('Ticket details updated successfully!');
      fetchData();
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update ticket.');
    } finally {
      setUpdatingAgent(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading ticket #{id}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '720px', margin: '2rem auto' }}>
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
        <Link to={isAgent ? '/agent/dashboard' : '/customer/dashboard'} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={isAgent ? '/agent/dashboard' : '/customer/dashboard'}
          className="nav-link"
          style={{ fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to {isAgent ? 'Agent Dashboard' : 'My Tickets'}</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAgent ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Left Column: Ticket Overview & Comments */}
        <div>
          <div className="card">
            <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Ticket #{ticket.id}
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {ticket.subject}
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {/* Customer & Assignment Meta */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                background: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Customer</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} />
                  {ticket.customer_name}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({ticket.customer_email})</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Agent</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: ticket.assigned_agent_name ? 'var(--text-main)' : 'var(--warning)' }}>
                  <UserCheck size={14} />
                  {ticket.assigned_agent_name || 'Unassigned'}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Created On</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} />
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Ticket Description */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Issue Description
              </h3>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {ticket.description}
              </div>
            </div>
          </div>

          {/* Conversation & Comments Thread */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} />
              <span>Conversation & Updates ({comments.length})</span>
            </h3>

            {comments.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <p>No comments or updates yet on this ticket.</p>
              </div>
            ) : (
              <div className="comment-thread">
                {comments.map((comment) => {
                  const commentIsAgent = comment.user_role === 'agent';
                  return (
                    <div
                      key={comment.id}
                      className="comment-box"
                      style={{
                        borderLeft: commentIsAgent ? '4px solid #9333ea' : '4px solid #2563eb',
                        backgroundColor: commentIsAgent ? '#faf5ff' : '#ffffff'
                      }}
                    >
                      <div className="comment-header">
                        <div className="comment-author">
                          {commentIsAgent ? <ShieldCheck size={16} color="#9333ea" /> : <User size={16} color="#2563eb" />}
                          <span>{comment.user_name}</span>
                          <span className={`badge badge-role-${comment.user_role}`}>
                            {comment.user_role}
                          </span>
                        </div>
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="comment-body">{comment.comment}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Post Comment Form */}
            <form onSubmit={handleAddComment} style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div className="form-group">
                <label className="form-label">Add Response or Comment</label>
                <textarea
                  className="form-control"
                  placeholder="Type your reply here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submittingComment || !newComment.trim()}
              >
                <Send size={14} />
                <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Support Agent Control Panel */}
        {isAgent && (
          <div>
            <div className="card" style={{ position: 'sticky', top: '5rem' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Settings size={18} />
                <span>Agent Control Panel</span>
              </h3>

              {updateSuccess && (
                <div className="alert alert-success" style={{ fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAgentUpdate}>
                <div className="form-group">
                  <label className="form-label">Ticket Status</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Support Agent</label>
                  <select
                    className="form-control"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={updatingAgent}
                >
                  <span>{updatingAgent ? 'Saving Changes...' : 'Update Ticket'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage;
