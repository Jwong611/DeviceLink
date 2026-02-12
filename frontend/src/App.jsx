import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newListing, setNewListing] = useState({ title: '', description: '' });

  const handleAuth = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Auth failed');
      if (endpoint === 'login') setIsLoggedIn(true);
      else { alert("Success! Please login."); setView('login'); }
    } catch (err) { alert(err.message); }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/listings`);
      if (response.ok) setListings(await response.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing),
      });
      if (response.ok) {
        setNewListing({ title: '', description: '' });
        setShowCreate(false);
        fetchListings();
      }
    } catch (err) { alert("Failed to create listing"); }
  };

  useEffect(() => { if (isLoggedIn) fetchListings(); }, [isLoggedIn]);

  // --- STYLES ---
  const pageWrapper = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Shifts content to the top
    minHeight: '100vh',
    width: '100vw',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#f8fafc',
    paddingTop: '5vh' // Provides spacing from the very top edge
  };

  const logoStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '2rem',
    color: '#1e293b'
  };

  const cardStyle = {
    backgroundColor: '#fff',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    width: '90%',
    maxWidth: '650px'
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px',
    margin: '8px 0 16px 0',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
  };

  // --- LOGGED IN VIEW ---
  if (isLoggedIn) {
    return (
      <div style={pageWrapper}>
        <div style={logoStyle}>DeviceLink</div>
        <div style={cardStyle}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <button onClick={() => setIsLoggedIn(false)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#64748b' }}>Logout</button>
          </header>

          {!showCreate ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Public Listings</h3>
                <button 
                  onClick={() => setShowCreate(true)}
                  style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Create Listing
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {listings.length > 0 ? (
                  listings.map(item => (
                    <div key={item.id} style={{ border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>{item.title}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>{item.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No listings available yet.</p>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateListing}>
              <h3>New Listing</h3>
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Device Name</label>
              <input required style={inputStyle} value={newListing.title} onChange={(e) => setNewListing({...newListing, title: e.target.value})} />
              
              <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Description</label>
              <textarea required style={{ ...inputStyle, height: '80px', fontFamily: 'inherit' }} value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Post</button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- LOGIN / REGISTER VIEW ---
  return (
    <div style={pageWrapper}>
      <div style={logoStyle}>DeviceLink</div>
      <div style={{ ...cardStyle, maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{view === 'login' ? 'Login' : 'Sign Up'}</h2>
        <div style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Username</label>
          <input style={inputStyle} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
          <input type="password" style={inputStyle} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button onClick={() => handleAuth(view)} style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>
            {view === 'login' ? 'Enter' : 'Join'}
          </button>
        </div>
        <p onClick={() => setView(view === 'login' ? 'register' : 'login')} style={{ marginTop: '1.5rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}>
          {view === 'login' ? "Need an account? Sign up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default App;