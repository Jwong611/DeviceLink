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
    quantity: 1,
    status: 'ACTIVE'
  });
  const [editingListingId, setEditingListingId] = useState(null);

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
    console.log('fetchListings called, username:', formData.username);
    try {
      // Fetch user's own listings (including unapproved)
      const ownUrl = `${API_BASE}/listings?own_username=${formData.username}`;
      console.log('Fetching own listings:', ownUrl);
      const ownRes = await fetch(ownUrl);
      console.log('Own response status:', ownRes.status, ownRes.ok);
      const ownData = ownRes.ok ? await ownRes.json() : { items: [] };
      const ownListings = ownData.items || [];
      console.log('Own listings:', ownListings);

      // Build query string for public listings with filters
      let publicQuery = `${API_BASE}/listings?approved=true`;
      if (searchTerm) publicQuery += `&q=${encodeURIComponent(searchTerm)}`;
      if (filterCategory) publicQuery += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterCondition) publicQuery += `&condition=${encodeURIComponent(filterCondition)}`;
      if (filterMinQty) publicQuery += `&min_quantity=${filterMinQty}`;
      if (filterMaxQty) publicQuery += `&max_quantity=${filterMaxQty}`;

      console.log('Fetching public listings:', publicQuery);
      const publicRes = await fetch(publicQuery);
      console.log('Public response status:', publicRes.status, publicRes.ok);
      const publicData = publicRes.ok ? await publicRes.json() : { items: [] };
      const publicListings = (publicData.items || []).filter(l => l.owner !== formData.username);
      console.log('Public listings:', publicListings);

      // Combine all listings
      const allListings = [...ownListings, ...publicListings];
      console.log('All listings:', allListings);
      setListings(allListings);
    } catch (err) { 
      console.error('Error in fetchListings:', err); 
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const isEditing = editingListingId !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_BASE}/listings/${editingListingId}?username=${formData.username}` : `${API_BASE}/listings`;
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? newListing : { ...newListing, owner: formData.username }),
      });
      
      if (response.ok) {
        setNewListing({ title: '', description: '', category: 'Laptop', condition: 'Good', quantity: 1, status: 'ACTIVE' });
        setShowCreate(false);
        setEditingListingId(null);
        fetchListings();
      } else {
        alert(`Failed to ${isEditing ? 'update' : 'create'} listing`);
      }
    } catch (err) { 
      alert(`Failed to ${editingListingId ? 'update' : 'create'} listing`); 
    }
  };

  const handleStatusUpdate = async (listingId, newStatus) => {
    console.log('handleStatusUpdate called:', listingId, newStatus);
    // Find the listing to get current values
    const listing = listings.find(l => l.id === listingId);
    console.log('Found listing:', listing);
    if (!listing) {
      console.error('Listing not found');
      return;
    }
    
    try {
      const updateData = {
        title: listing.title,
        description: listing.description,
        category: listing.category,
        condition: listing.condition,
        quantity: listing.quantity,
        status: newStatus
      };
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${API_BASE}/listings/${listingId}?username=${formData.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      console.log('Update response status:', response.status, response.ok);
      
      if (response.ok) {
        console.log('Status update successful, fetching listings...');
        fetchListings();
      } else {
        const errorText = await response.text();
        console.error('Failed to update status:', errorText);
        alert("Failed to update status: " + errorText);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert("Failed to update status: " + err.message);
    }
  };

  const handleEditListing = (listing) => {
    setNewListing({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      quantity: listing.quantity,
      status: listing.status
    });
    setEditingListingId(listing.id);
    setShowCreate(true);
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}?username=${formData.username}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchListings();
      } else {
        alert("Failed to delete listing");
      }
    } catch (err) {
      alert("Failed to delete listing");
    }
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
        {isOwn && (
          <span style={{ 
            marginLeft: '10px', 
            padding: '2px 8px', 
            borderRadius: '8px', 
            fontSize: '0.8rem',
            fontWeight: '600',
            backgroundColor: (item.status === 'ACTIVE' || !item.status) ? '#dcfce7' : item.status === 'COMPLETED' ? '#fef3c7' : '#fee2e2',
            color: (item.status === 'ACTIVE' || !item.status) ? '#166534' : item.status === 'COMPLETED' ? '#92400e' : '#991b1b'
          }}>
            {item.status || 'ACTIVE'}
          </span>
        )}
      </div>
      <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>{item.description}</p>
      {isOwn && (
        <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Update Status:</label>
          <select 
            value={item.status || 'ACTIVE'} 
            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db', 
              fontSize: '0.9rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="ACTIVE">Active - Visible to everyone</option>
            <option value="COMPLETED">Completed - Donation completed</option>
            <option value="DELETED">Deleted - Hidden from public</option>
          </select>
        </div>
      )}
      {isOwn && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            onClick={() => handleEditListing(item)}
            style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            Edit Details
          </button>
          <button 
            onClick={() => handleDeleteListing(item.id)}
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            Delete Listing
          </button>
        </div>
      )}
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
              <h3 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center' }}>
                {editingListingId ? 'Edit Listing' : 'Create New Listing'}
              </h3>
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
                
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={newListing.status} onChange={(e) => setNewListing({...newListing, status: e.target.value})}>
                  <option value="ACTIVE">Active - Visible to everyone</option>
                  <option value="COMPLETED">Completed - Donation completed</option>
                  <option value="DELETED">Deleted - Hidden from public</option>
                </select>
                
                <label style={labelStyle}>Description</label>
                <textarea required placeholder="Tell us about the device..." style={{ ...inputStyle, height: '150px' }} value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '1.5rem' }}>
                  <button type="submit" style={{ flex: 2, padding: '20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '700' }}>
                    {editingListingId ? 'Update Listing' : 'Publish Listing'}
                  </button>
                  <button type="button" onClick={() => { setShowCreate(false); setNewListing({ title: '', description: '', category: 'Laptop', condition: 'Good', quantity: 1, status: 'ACTIVE' }); setEditingListingId(null); }} style={{ flex: 1, padding: '20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '600' }}>Cancel</button>
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