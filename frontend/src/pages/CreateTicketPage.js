import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Send, ShieldAlert, CheckCircle } from 'lucide-react';

const CreateTicketPage = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/tickets', {
        subject: subject.trim(),
        description: description.trim(),
        priority
      });

      setSuccess('Ticket created successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/tickets/${res.data.id}`);
      }, 1000);
    } catch (err) {
      console.error('Failed to create ticket:', err);
      const msg = err.response?.data?.error || 'Failed to submit ticket. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/customer/dashboard" className="nav-link" style={{ fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Create New Support Ticket
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Describe your issue in detail. Our support team will assist you shortly.
        </p>

        {error && (
          <div className="alert alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject / Short Summary *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Cannot connect to company VPN"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority Level *</label>
            <select
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low - Minor question or feedback</option>
              <option value="medium">Medium - Standard issue requiring resolution</option>
              <option value="high">High - Urgent issue blocking work</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-control"
              placeholder="Provide exact error messages, steps to reproduce, or any relevant details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Link to="/customer/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketPage;
