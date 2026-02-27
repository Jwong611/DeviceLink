import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

function Admin({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('accounts');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userWarnings, setUserWarnings] = useState([]);
  const [warningReason, setWarningReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'accounts') {
          const res = await fetch(`${API_BASE}/admin/users`);
          if (res.ok) setUsers(await res.json());
        } else if (activeTab === 'listings') {
          const res = await fetch(`${API_BASE}/admin/listings`);
          if (res.ok) setListings(await res.json());
        } else if (activeTab === 'activity') {
          const res = await fetch(`${API_BASE}/admin/activity-logs`);
          if (res.ok) setActivityLogs(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    try {
      const res = await fetch(`${API_BASE}/admin/warnings/${user.username}`);
      if (res.ok) setUserWarnings(await res.json());
    } catch (err) {
      console.error('Failed to fetch warnings:', err);
    }
  };

  const handleIssueWarning = async () => {
    if (!warningReason.trim() || !selectedUser) {
      alert('Please enter a warning reason');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/warning?admin_username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          reason: warningReason,
        }),
      });

      if (res.ok) {
        alert('Warning issued successfully');
        setWarningReason('');
        handleSelectUser(selectedUser);
        // Refresh users list
        const usersRes = await fetch(`${API_BASE}/admin/users`);
        if (usersRes.ok) setUsers(await usersRes.json());
      } else {
        alert('Failed to issue warning');
      }
    } catch (err) {
      alert('Error issuing warning');
    }
  };

  const handleSuspendUser = async (userToSuspend, shouldSuspend) => {
    try {
      const res = await fetch(`${API_BASE}/admin/suspend?admin_username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToSuspend,
          is_suspended: shouldSuspend,
        }),
      });

      if (res.ok) {
        alert(shouldSuspend ? 'User suspended' : 'User unsuspended');
        const usersRes = await fetch(`${API_BASE}/admin/users`);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (selectedUser && selectedUser.username === userToSuspend) {
          handleSelectUser({ ...selectedUser, is_suspended: shouldSuspend });
        }
      }
    } catch (err) {
      alert('Error updating suspension status');
    }
  };

  const handleApproveListing = async (listingId, approved) => {
    try {
      const res = await fetch(`${API_BASE}/admin/approve-listing?admin_username=${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          approved: approved,
        }),
      });

      if (res.ok) {
        alert(approved ? 'Listing approved' : 'Listing rejected');
        const listingsRes = await fetch(`${API_BASE}/admin/listings`);
        if (listingsRes.ok) setListings(await listingsRes.json());
      }
    } catch (err) {
      alert('Error updating listing');
    }
  };

  // Styles
  const pageWrapper = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#f1f5f9',
    paddingTop: '2vh',
  };

  const cardStyle = {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    width: '95%',
    maxWidth: '1400px',
    minHeight: '80vh',
  };

  const tabsStyle = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #f8fafc',
    paddingBottom: '1rem',
  };

  const tabButtonStyle = (active) => ({
    padding: '12px 24px',
    border: 'none',
    backgroundColor: active ? '#2563eb' : '#e2e8f0',
    color: active ? '#fff' : '#475569',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  });

  const contentWrapper = {
    display: 'grid',
    gridTemplateColumns: selectedUser ? '350px 1fr' : '1fr',
    gap: '2rem',
  };

  const userItemStyle = (selected) => ({
    padding: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: selected ? '#dbeafe' : '#f8fafc',
    border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
    marginBottom: '0.5rem',
    transition: 'all 0.2s',
  });

  const listingBoxStyle = (status) => ({
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    backgroundColor: status === 'ACTIVE' ? '#dcfce7' : status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  });

  const activityItemStyle = {
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    marginBottom: '0.5rem',
    borderLeft: '4px solid #2563eb',
  };

  const buttonStyle = (variant = 'primary') => {
    const variants = {
      primary: { backgroundColor: '#2563eb', color: '#fff' },
      danger: { backgroundColor: '#ef4444', color: '#fff' },
      success: { backgroundColor: '#059669', color: '#fff' },
      secondary: { backgroundColor: '#e2e8f0', color: '#475569' },
    };
    return {
      padding: '10px 16px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '600',
      ...variants[variant],
    };
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px',
    margin: '8px 0 12px 0',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    boxSizing: 'border-box',
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: '#334155',
  };

  // Render Accounts Tab
  const renderAccountsTab = () => (
    <div style={contentWrapper}>
      {selectedUser && (
        <div style={{ minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#1e293b' }}>
            {selectedUser.username}
          </h3>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>Status:</strong> {selectedUser.is_suspended ? '🔴 Suspended' : '🟢 Active'}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>Warnings:</strong> {selectedUser.warning_count}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>Admin:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Issue Warning</h4>
            <textarea
              style={{ ...inputStyle, height: '80px' }}
              placeholder="Reason for warning..."
              value={warningReason}
              onChange={(e) => setWarningReason(e.target.value)}
            />
            <button onClick={handleIssueWarning} style={buttonStyle('danger')}>
              Issue Warning
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Account Status</h4>
            <button
              onClick={() =>
                handleSuspendUser(selectedUser.username, !selectedUser.is_suspended)
              }
              style={{
                width: '100%',
                padding: '12px',
                ...buttonStyle(selectedUser.is_suspended ? 'success' : 'danger'),
              }}
            >
              {selectedUser.is_suspended ? '✓ Unsuspend User' : '✕ Suspend User'}
            </button>
          </div>

          {userWarnings.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Recent Warnings</h4>
              {userWarnings.map((warning) => (
                <div
                  key={warning.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#fee2e2',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#7f1d1d',
                  }}
                >
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>{warning.reason}</strong>
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>
                    By: {warning.issued_by}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#1e293b' }}>
          Accounts
        </h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              style={userItemStyle(selectedUser?.id === user.id)}
              onClick={() => handleSelectUser(user)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#1e293b' }}>{user.username}</strong>
                {user.is_admin && <span style={{ fontSize: '0.8rem', color: '#7c2d12', fontWeight: 'bold' }}>👑 ADMIN</span>}
              </div>
              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                {user.is_suspended ? '🔴 Suspended' : '🟢 Active'} • ⚠️ {user.warning_count} warnings
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render Listings Tab
  const renderListingsTab = () => (
    <div>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: '#1e293b' }}>
        Pending Moderation
      </h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        listings.map((listing) => (
          <div key={listing.id} style={listingBoxStyle(listing.status)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{listing.title}</h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                  By: <strong>{listing.owner}</strong> • Category: <strong>{listing.category}</strong>
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {new Date(listing.created_at).toLocaleString()}
                </p>
              </div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: listing.status === 'ACTIVE' ? '#d1fae5' : listing.status === 'REJECTED' ? '#f3f4f6' : '#fef3c7',
                  color: listing.status === 'ACTIVE' ? '#065f46' : listing.status === 'REJECTED' ? '#dc2626' : '#92400e',
                }}
              >
                {listing.status === 'ACTIVE' ? '✓ Approved' : listing.status === 'REJECTED' ? '✕ Rejected' : '⏳ Pending'}
              </span>
            </div>

            {listing.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => handleApproveListing(listing.id, true)}
                  style={buttonStyle('success')}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleApproveListing(listing.id, false)}
                  style={buttonStyle('danger')}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Render Activity Tab
  const renderActivityTab = () => (
    <div>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: '#1e293b' }}>
        Platform Activity Log
      </h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        activityLogs.map((log) => (
          <div key={log.id} style={activityItemStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#1e293b' }}>
                {log.action.replace(/_/g, ' ').toUpperCase()}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0', color: '#475569' }}>
              <strong>User:</strong> {log.username}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.95rem' }}>
              {log.details}
            </p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={pageWrapper}>
      <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' }}>
        Admin Dashboard
      </div>
      <div style={{ marginBottom: '2rem', color: '#64748b', fontSize: '1.1rem' }}>
        Welcome, <strong>{username}</strong>
      </div>

      <div style={cardStyle}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            borderBottom: '2px solid #f8fafc',
            paddingBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#1e293b' }}>Management Center</h2>
          <button
            onClick={onLogout}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              color: '#ef4444',
              fontSize: '1.1rem',
              fontWeight: '700',
            }}
          >
            Logout
          </button>
        </header>

        <div style={tabsStyle}>
          <button
            onClick={() => setActiveTab('accounts')}
            style={tabButtonStyle(activeTab === 'accounts')}
          >
            👥 Accounts
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            style={tabButtonStyle(activeTab === 'listings')}
          >
            📋 Listings
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={tabButtonStyle(activeTab === 'activity')}
          >
            📊 Activity
          </button>
        </div>

        <div>
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'listings' && renderListingsTab()}
          {activeTab === 'activity' && renderActivityTab()}
        </div>
      </div>
    </div>
  );
}

export default Admin;
