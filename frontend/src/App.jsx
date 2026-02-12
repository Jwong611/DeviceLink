import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [listings, setListings] = useState([]);
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
    try {
      const response = await fetch(`${API_BASE}/listings`);
      if (response.ok) setListings(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newListing, owner: formData.username }),
      });
      if (response.ok) {
        setNewListing({ title: '', description: '' });
        setShowCreate(false);
        fetchListings();
      }
    } catch (err) { alert("Failed to create listing"); }
  };

  useEffect(() => { if (isLoggedIn) fetchListings(); }, [isLoggedIn]);

  const myListings = listings.filter(l => l.owner === formData.username);
  const publicListings = listings.filter(l => l.owner !== formData.username);

  const pageWrapper = { display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', width: '100vw', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', paddingTop: '5vh' };
  const logoStyle = { fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' };
  const cardStyle = { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', width: '90%', maxWidth: '700px' };
  const inputStyle = { display: 'block', width: '100%', padding: '12px', margin: '8px 0 16px 0', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };

  const ListingBox = ({ item, isOwn }) => (
    <div style={{ border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '8px', backgroundColor: isOwn ? '#eff6ff' : '#fdfdfd', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>{item.title}</h4>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.owner}</span>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{item.description}</p>
    </div>
  );

  if (isLoggedIn) {
    return (
      <div style={pageWrapper}>
        <div style={logoStyle}>DeviceLink</div>
        <div style={{ marginBottom: '2rem', color: '#64748b' }}>Welcome, <strong>{formData.username}</strong></div>
        
        <div style={cardStyle}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <button onClick={() => setIsLoggedIn(false)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444' }}>Logout</button>
          </header>

          {!showCreate ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>My Listings</h3>
                  <button onClick={() => setShowCreate(true)} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+ New</button>
                </div>
                {myListings.map(item => <ListingBox key={item.id} item={item} isOwn={true} />)}
                {myListings.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No personal listings.</p>}
              </div>

              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Community</h3>
                {publicListings.map(item => <ListingBox key={item.id} item={item} isOwn={false} />)}
                {publicListings.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No public listings.</p>}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateListing}>
              <h3>Create New Listing</h3>
              <input required placeholder="Device Name" style={inputStyle} value={newListing.title} onChange={(e) => setNewListing({...newListing, title: e.target.value})} />
              <textarea required placeholder="Description" style={{ ...inputStyle, height: '80px' }} value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Post</button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <div style={logoStyle}>DeviceLink</div>
      <div style={{ ...cardStyle, maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{view === 'login' ? 'Login' : 'Sign Up'}</h2>
        <input placeholder="Username" style={inputStyle} onChange={(e) => setFormData({...formData, username: e.target.value})} />
        <input type="password" placeholder="Password" style={inputStyle} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button onClick={() => handleAuth(view)} style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {view === 'login' ? 'Enter' : 'Join'}
        </button>
        <p onClick={() => setView(view === 'login' ? 'register' : 'login')} style={{ marginTop: '1.5rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}>
          {view === 'login' ? "Need an account? Sign up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default App;