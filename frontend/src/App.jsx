import React, { useState, useEffect } from 'react';
import Admin from './Admin';

const API_BASE = "http://localhost:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [listings, setListings] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterMinQty, setFilterMinQty] = useState('');
  const [filterMaxQty, setFilterMaxQty] = useState('');
  const [newListing, setNewListing] = useState({ 
    title: '', 
    description: '', 
    category: 'Laptop', 
    condition: 'Good', 
    quantity: 1 
  });

  // --- Auth Logic ---
  const handleAuth = async (endpoint) => {
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Corrected to send user credentials
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Auth failed');
      
      if (endpoint === 'login') {
        setIsLoggedIn(true);
        try {
          const adminRes = await fetch(`${API_BASE}/admin/check/${formData.username}`);
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            setIsAdmin(adminData.is_admin);
          }
        } catch (err) {
          console.log('Could not check admin status');
        }
      }
      else { 
        alert("Success! Please login."); 
        setView('login'); 
      }
    } catch (err) { alert(err.message); }
  };

  const fetchListings = async () => {
    try {
      // Fetch user's own listings (including unapproved)
      const ownRes = await fetch(`${API_BASE}/listings?own_username=${formData.username}`);
      const ownData = ownRes.ok ? await ownRes.json() : { items: [] };
      const ownListings = ownData.items || [];

      // Build query string for public listings with filters
      let publicQuery = `${API_BASE}/listings?approved=true`;
      if (searchTerm) publicQuery += `&q=${encodeURIComponent(searchTerm)}`;
      if (filterCategory) publicQuery += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterCondition) publicQuery += `&condition=${encodeURIComponent(filterCondition)}`;
      if (filterMinQty) publicQuery += `&min_quantity=${filterMinQty}`;
      if (filterMaxQty) publicQuery += `&max_quantity=${filterMaxQty}`;

      const publicRes = await fetch(publicQuery);
      const publicData = publicRes.ok ? await publicRes.json() : { items: [] };
      const publicListings = (publicData.items || []).filter(l => l.owner !== formData.username);

      // Combine all listings
      setListings([...ownListings, ...publicListings]);
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
        setNewListing({ title: '', description: '', category: 'Laptop', condition: 'Good', quantity: 1 });
        setShowCreate(false);
        fetchListings();
      }
    } catch (err) { alert("Failed to create listing"); }
  };

  useEffect(() => { if (isLoggedIn) fetchListings(); }, [isLoggedIn]);

  const myListings = listings.filter(l => l.owner === formData.username);
  const publicListings = listings.filter(l => l.owner !== formData.username);

  // --- Styles ---
  const pageWrapper = { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    minHeight: '100vh', width: '100vw', fontFamily: 'system-ui, sans-serif', 
    backgroundColor: '#f1f5f9', paddingTop: '2vh' 
  };
  
  const logoStyle = { fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e293b' };
  
  const cardStyle = { 
    backgroundColor: '#fff', padding: '3rem', borderRadius: '16px', 
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', width: '95%',            
    maxWidth: '1400px', minHeight: '80vh'        
  };

  const inputStyle = { 
    display: 'block', width: '100%', padding: '16px', margin: '12px 0 20px 0', 
    borderRadius: '10px', border: '2px solid #e2e8f0', boxSizing: 'border-box',
    fontSize: '1.2rem', fontFamily: 'inherit', color: '#334155'
  };

  const labelStyle = { fontSize: '1.1rem', fontWeight: '600', color: '#64748b' };

  // --- Sub-Components ---
  const ListingBox = ({ item, isOwn }) => (
    <div style={{ 
      border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '12px', 
      backgroundColor: isOwn ? '#eff6ff' : '#ffffff', marginBottom: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.3rem' }}>{item.title}</h4>
        <span style={{ 
          fontSize: '0.9rem', padding: '4px 12px', borderRadius: '12px', 
          backgroundColor: isOwn ? '#dbeafe' : '#f1f5f9', color: '#475569', fontWeight: '700'
        }}>{item.category}</span>
      </div>
      <div style={{ fontSize: '1rem', color: '#64748b', marginBottom: '10px' }}>
        Condition: <strong style={{color: '#334155'}}>{item.condition}</strong> | Qty: <strong style={{color: '#334155'}}>{item.quantity}</strong>
      </div>
      <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>{item.description}</p>
      {!isOwn && (
        <div style={{ fontSize: '0.95rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>👤 Posted by:</span>
          <strong style={{ color: '#2563eb' }}>{item.owner}</strong>
        </div>
      )}
    </div>
  );

  // --- Render Logic ---
  if (isLoggedIn) {
    if (isAdmin) {
      return <Admin username={formData.username} onLogout={() => { setIsLoggedIn(false); setIsAdmin(false); }} />;
    }
    return (
      <div style={pageWrapper}>
        <div style={logoStyle}>DeviceLink</div>
        <div style={{ marginBottom: '2rem', color: '#64748b', fontSize: '1.3rem' }}>
          Welcome, <strong>{formData.username}</strong>
        </div>
      
        <div style={cardStyle}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '2px solid #f8fafc', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '2.2rem', margin: 0 }}>Dashboard</h2>
            <button onClick={() => { setIsLoggedIn(false); setIsAdmin(false); }} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444', fontSize: '1.2rem', fontWeight: '700' }}>Logout</button>
          </header>

          {!showCreate ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2px 1fr', gap: '4rem', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>My Listings</h3>
                  <button onClick={() => setShowCreate(true)} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }}>+ Create New</button>
                </div>
                {myListings.map(item => <ListingBox key={item.id} item={item} isOwn={true} />)}
                {myListings.length === 0 && <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>No personal listings yet.</p>}
              </div>

              <div style={{ backgroundColor: '#f1f5f9', width: '100%', height: '100%', minHeight: '500px', borderRadius: '2px' }}></div>

              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', color: '#1e293b' }}>Community Marketplace</h3>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#475569', fontWeight: '600' }}>Search & Filter</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Search listings..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ ...inputStyle, margin: 0, padding: '12px' }} 
                      />
                      <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)} 
                        style={{ ...inputStyle, margin: 0, padding: '12px' }}
                      >
                        <option value="">All Categories</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Phone">Phone</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <select 
                        value={filterCondition} 
                        onChange={(e) => setFilterCondition(e.target.value)} 
                        style={{ ...inputStyle, margin: 0, padding: '12px' }}
                      >
                        <option value="">All Conditions</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="number" 
                          placeholder="Min Qty" 
                          min="0" 
                          value={filterMinQty} 
                          onChange={(e) => setFilterMinQty(e.target.value)} 
                          style={{ ...inputStyle, margin: 0, padding: '12px', flex: 1 }} 
                        />
                        <input 
                          type="number" 
                          placeholder="Max Qty" 
                          min="0" 
                          value={filterMaxQty} 
                          onChange={(e) => setFilterMaxQty(e.target.value)} 
                          style={{ ...inputStyle, margin: 0, padding: '12px', flex: 1 }} 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={fetchListings} 
                      style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                {publicListings.map(item => <ListingBox key={item.id} item={item} isOwn={false} />)}
                {publicListings.length === 0 && <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>No listings match your filters.</p>}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
              <h3 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center' }}>Create New Listing</h3>
              <form onSubmit={handleCreateListing}>
                <label style={labelStyle}>Device Title</label>
                <input required placeholder="What are you listing?" style={inputStyle} value={newListing.title} onChange={(e) => setNewListing({...newListing, title: e.target.value})} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={newListing.category} onChange={(e) => setNewListing({...newListing, category: e.target.value})}>
                      <option value="Laptop">Laptop</option>
                      <option value="Phone">Phone</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Condition</label>
                    <select style={inputStyle} value={newListing.condition} onChange={(e) => setNewListing({...newListing, condition: e.target.value})}>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                <label style={labelStyle}>Quantity</label>
                <input type="number" required style={inputStyle} min="1" value={newListing.quantity} onChange={(e) => setNewListing({...newListing, quantity: parseInt(e.target.value) || 1})} />
                
                <label style={labelStyle}>Description</label>
                <textarea required placeholder="Tell us about the device..." style={{ ...inputStyle, height: '150px' }} value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '1.5rem' }}>
                  <button type="submit" style={{ flex: 2, padding: '20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '700' }}>Publish Listing</button>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '600' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <div style={logoStyle}>DeviceLink</div>
      <div style={{ ...cardStyle, maxWidth: '450px', minHeight: 'auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>{view === 'login' ? 'Login' : 'Sign Up'}</h2>
        <input placeholder="Username" style={inputStyle} onChange={(e) => setFormData({...formData, username: e.target.value})} />
        <input type="password" placeholder="Password" style={inputStyle} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button onClick={() => handleAuth(view)} style={{ width: '100%', padding: '16px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: '600' }}>
          {view === 'login' ? 'Enter Dashboard' : 'Create Account'}
        </button>
        <p onClick={() => setView(view === 'login' ? 'register' : 'login')} style={{ marginTop: '2rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '1.1rem', fontWeight: '500' }}>
          {view === 'login' ? "New here? Join the community" : "Already a member? Log in"}
        </p>
      </div>
    </div>
  );
}

export default App;