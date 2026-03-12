import React, { useState, useEffect, useRef } from 'react';
import Admin from './Admin';

const API_BASE = 'http://localhost:8000';
const SESSION_KEY = 'devicelink_session';

function App() {
  const getSavedSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const savedSession = getSavedSession();
  const [themeMode, setThemeMode] = useState(localStorage.getItem('devicelink_theme') || 'light');
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(savedSession?.isLoggedIn));
  const [isAdmin, setIsAdmin] = useState(Boolean(savedSession?.isAdmin));
  const [authView, setAuthView] = useState('login');
  const [currentPage, setCurrentPage] = useState(savedSession?.currentPage || 'dashboard');

  const [formData, setFormData] = useState({ username: savedSession?.username || '', password: '' });
  const [listings, setListings] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
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
    status: 'PENDING',
  });
  const [editingListingId, setEditingListingId] = useState(null);

  const [chatThreads, setChatThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [toastNotifications, setToastNotifications] = useState([]);
  const activeThreadRef = useRef(null);
  const unreadByThreadRef = useRef({});
  const unreadInitializedRef = useRef(false);
  const toastIdRef = useRef(1);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  useEffect(() => {
    localStorage.setItem('devicelink_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!isLoggedIn || !formData.username) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        isLoggedIn: true,
        isAdmin,
        username: formData.username,
        currentPage,
      })
    );
  }, [isLoggedIn, isAdmin, formData.username, currentPage]);

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentPage('dashboard');
    setActiveThread(null);
    setChatThreads([]);
    setChatMessages([]);
    setChatInput('');
    setShowCreate(false);
    setEditingListingId(null);
    setToastNotifications([]);
    localStorage.removeItem(SESSION_KEY);
    unreadByThreadRef.current = {};
    unreadInitializedRef.current = false;
  };

  const addToastNotification = (message) => {
    const id = toastIdRef.current++;
    setToastNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToastNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  const handleAdminTransferComplete = () => {
    setIsAdmin(false);
    setCurrentPage('dashboard');
    addToastNotification('Admin privileges transferred successfully');
  };

  const handleAuth = async (endpoint) => {
    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Auth failed');

      if (endpoint === 'login') {
        setIsLoggedIn(true);
        setCurrentPage('dashboard');
        try {
          const adminRes = await fetch(`${API_BASE}/admin/check/${formData.username}`);
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            setIsAdmin(adminData.is_admin);
          }
        } catch {
          console.log('Could not check admin status');
        }
      } else {
        alert('Success! Please login.');
        setAuthView('login');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchListings = async () => {
    try {
      const ownRes = await fetch(`${API_BASE}/listings?own_username=${formData.username}`);
      const ownData = ownRes.ok ? await ownRes.json() : { items: [] };
      const ownListings = ownData.items || [];

      let publicQuery = `${API_BASE}/listings?approved=true`;
      if (searchTerm) publicQuery += `&q=${encodeURIComponent(searchTerm)}`;
      if (filterCategory) publicQuery += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterCondition) publicQuery += `&condition=${encodeURIComponent(filterCondition)}`;
      if (filterMinQty) publicQuery += `&min_quantity=${filterMinQty}`;
      if (filterMaxQty) publicQuery += `&max_quantity=${filterMaxQty}`;

      const publicRes = await fetch(publicQuery);
      const publicData = publicRes.ok ? await publicRes.json() : { items: [] };
      const publicListings = (publicData.items || []).filter((l) => l.owner !== formData.username);

      setListings([...ownListings, ...publicListings]);
    } catch (err) {
      console.error('Error in fetchListings:', err);
    }
  };

  const fetchDonationHistory = async () => {
    if (!formData.username) return;

    try {
      const res = await fetch(`${API_BASE}/donation-history?username=${encodeURIComponent(formData.username)}`);
      if (!res.ok) return;
      const data = await res.json();
      setDonationHistory(data);
    } catch (err) {
      console.error('Failed to fetch donation history:', err);
    }
  };

  const fetchChatThreads = async (showNotifications = false) => {
    if (!formData.username) return;

    try {
      const res = await fetch(`${API_BASE}/chat/threads?username=${encodeURIComponent(formData.username)}`);
      if (!res.ok) return;
      const data = await res.json();

      const nextUnreadByThread = {};
      data.forEach((thread) => {
        nextUnreadByThread[thread.id] = thread.unread_count || 0;
      });

      if (showNotifications && unreadInitializedRef.current) {
        data.forEach((thread) => {
          const previousUnread = unreadByThreadRef.current[thread.id] || 0;
          const currentUnread = thread.unread_count || 0;
          if (currentUnread > previousUnread) {
            const isActiveThread = currentPage === 'chat' && activeThreadRef.current?.id === thread.id;
            if (!isActiveThread) {
              const counterpart = thread.owner_username === formData.username
                ? thread.participant_username
                : thread.owner_username;
              const delta = currentUnread - previousUnread;
              addToastNotification(
                delta === 1
                  ? `New message from ${counterpart}`
                  : `${delta} new messages from ${counterpart}`
              );
            }
          }
        });
      }

      setChatThreads(data);
      unreadByThreadRef.current = nextUnreadByThread;
      unreadInitializedRef.current = true;

      const currentActive = activeThreadRef.current;
      if (currentActive) {
        const stillExists = data.some((t) => t.id === currentActive.id);
        if (!stillExists) {
          setActiveThread(null);
          setChatMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat threads:', err);
    }
  };

  const fetchThreadMessages = async (threadId, markRead = false) => {
    try {
      const res = await fetch(
        `${API_BASE}/chat/threads/${threadId}/messages?username=${encodeURIComponent(formData.username)}&mark_read=${markRead ? 'true' : 'false'}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setChatMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const openThread = async (thread) => {
    setActiveThread(thread);
    setChatError('');
    await fetchThreadMessages(thread.id, true);
    await fetchChatThreads();
  };

  const handleOpenChatForListing = async (listingId) => {
    setChatLoading(true);
    setChatError('');

    try {
      const res = await fetch(`${API_BASE}/chat/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, username: formData.username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to open chat');

      await fetchChatThreads();
      await openThread(data);
      setCurrentPage('chat');
    } catch (err) {
      setChatError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const content = chatInput.trim();
    if (!content || !activeThread) return;

    try {
      const res = await fetch(
        `${API_BASE}/chat/threads/${activeThread.id}/messages?username=${encodeURIComponent(formData.username)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_username: formData.username, content }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send message');

      setChatInput('');
      setChatMessages((prev) => [...prev, data]);
      await fetchChatThreads();
    } catch (err) {
      setChatError(err.message);
    }
  };

  const getPotentialRecipients = (listingId) => {
    return chatThreads
      .filter((thread) => thread.listing_id === listingId)
      .map((thread) => (
        thread.owner_username === formData.username
          ? thread.participant_username
          : thread.owner_username
      ))
      .filter((value, index, array) => value && array.indexOf(value) === index);
  };

  const handleCompleteDonation = async (listing) => {
    const potentialRecipients = getPotentialRecipients(listing.id);
    const promptLabel = potentialRecipients.length > 0
      ? `Enter recipient username. Suggested: ${potentialRecipients.join(', ')}`
      : 'Enter recipient username';
    const recipientUsername = window.prompt(promptLabel, potentialRecipients[0] || '');

    if (!recipientUsername || !recipientUsername.trim()) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/listings/${listing.id}/complete?username=${encodeURIComponent(formData.username)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_username: recipientUsername.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to complete donation');
      }

      addToastNotification(`Donation marked completed for ${data.recipient_username}`);
      fetchListings();
      fetchDonationHistory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();

    try {
      const isEditing = editingListingId !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${API_BASE}/listings/${editingListingId}?username=${formData.username}`
        : `${API_BASE}/listings`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? newListing : { ...newListing, owner: formData.username }),
      });

      if (response.ok) {
        setNewListing({ title: '', description: '', category: 'Laptop', condition: 'Good', quantity: 1, status: 'PENDING' });
        setShowCreate(false);
        setEditingListingId(null);
        fetchListings();
      } else {
        alert(`Failed to ${isEditing ? 'update' : 'create'} listing`);
      }
    } catch {
      alert(`Failed to ${editingListingId ? 'update' : 'create'} listing`);
    }
  };

  const handleStatusUpdate = async (listingId, newStatus) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    try {
      const updateData = {
        title: listing.title,
        description: listing.description,
        category: listing.category,
        condition: listing.condition,
        quantity: listing.quantity,
        status: newStatus,
      };

      const response = await fetch(`${API_BASE}/listings/${listingId}?username=${formData.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchListings();
      } else {
        alert('Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleEditListing = (listing) => {
    setNewListing({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      quantity: listing.quantity,
      status: listing.status,
    });
    setEditingListingId(listing.id);
    setShowCreate(true);
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}?username=${formData.username}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchListings();
      } else {
        alert('Failed to delete listing');
      }
    } catch {
      alert('Failed to delete listing');
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchListings();
    fetchDonationHistory();
    fetchChatThreads(false);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const intervalId = setInterval(() => {
      fetchChatThreads(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isLoggedIn, formData.username, currentPage]);

  useEffect(() => {
    if (currentPage !== 'chat') return;
    if (!activeThread && chatThreads.length > 0) {
      openThread(chatThreads[0]);
    }
  }, [currentPage, chatThreads.length]);

  const myListings = listings.filter((l) => l.owner === formData.username);
  const publicListings = listings.filter((l) => l.owner !== formData.username);
  const totalUnreadCount = chatThreads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
  const isDarkMode = themeMode === 'dark';
  const theme = isDarkMode
    ? {
      pageBg: '#0b1220',
      surface: '#111827',
      surfaceAlt: '#1f2937',
      border: '#334155',
      text: '#e5e7eb',
      textMuted: '#9ca3af',
      textStrong: '#f9fafb',
      inputBg: '#0f172a',
      inputBorder: '#334155',
      divider: '#1f2937',
      accentSurface: '#1e3a5f',
    }
    : {
      pageBg: '#f1f5f9',
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      border: '#e2e8f0',
      text: '#334155',
      textMuted: '#64748b',
      textStrong: '#1e293b',
      inputBg: '#ffffff',
      inputBorder: '#e2e8f0',
      divider: '#f8fafc',
      accentSurface: '#dbeafe',
    };

  const pageWrapper = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: theme.pageBg,
    paddingTop: '2vh',
    color: theme.text,
  };

  const logoStyle = { fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', color: theme.textStrong };
  const labelStyle = { fontSize: '1.1rem', fontWeight: '600', color: theme.textMuted };

  const cardStyle = {
    backgroundColor: theme.surface,
    padding: '3rem',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    width: '95%',
    maxWidth: '1400px',
    minHeight: '80vh',
    border: `1px solid ${theme.border}`,
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    margin: '12px 0 20px 0',
    borderRadius: '10px',
    border: `2px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBg,
    boxSizing: 'border-box',
    fontSize: '1.2rem',
    fontFamily: 'inherit',
    color: theme.text,
  };

  const HeaderNav = () => (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: `2px solid ${theme.divider}`, paddingBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '2.2rem', margin: 0, color: theme.textStrong }}>Dashboard</h2>
        <button
          onClick={() => setCurrentPage('dashboard')}
          style={{
            border: currentPage === 'dashboard' ? '1px solid #2563eb' : `1px solid ${theme.border}`,
            backgroundColor: currentPage === 'dashboard' ? theme.accentSurface : theme.surfaceAlt,
            color: theme.textStrong,
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Listings
        </button>
        <button
          onClick={() => {
            setCurrentPage('chat');
            fetchChatThreads(false);
          }}
          style={{
            border: currentPage === 'chat' ? '1px solid #2563eb' : `1px solid ${theme.border}`,
            backgroundColor: currentPage === 'chat' ? theme.accentSurface : theme.surfaceAlt,
            color: theme.textStrong,
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Chats
          {totalUnreadCount > 0 && (
            <span style={{ marginLeft: '8px', backgroundColor: '#dc2626', color: '#fff', borderRadius: '999px', padding: '2px 7px', fontSize: '0.75rem', fontWeight: '700' }}>
              {totalUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setCurrentPage('history');
            fetchDonationHistory();
          }}
          style={{
            border: currentPage === 'history' ? '1px solid #2563eb' : `1px solid ${theme.border}`,
            backgroundColor: currentPage === 'history' ? theme.accentSurface : theme.surfaceAlt,
            color: theme.textStrong,
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          History
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
          style={{ cursor: 'pointer', border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.textStrong, borderRadius: '8px', padding: '8px 12px', fontWeight: '700' }}
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={logout} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444', fontSize: '1.2rem', fontWeight: '700' }}>
          Logout
        </button>
      </div>
    </header>
  );

  const ChatPage = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: '12px', backgroundColor: theme.surfaceAlt, padding: '10px', maxHeight: '620px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 10px 0', color: theme.textStrong }}>Threads</h3>

        {chatThreads.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: '0.95rem' }}>No chat threads yet. Open a listing and click "Chat with Owner".</p>
        ) : (
          chatThreads.map((thread) => {
            const counterpart = thread.owner_username === formData.username ? thread.participant_username : thread.owner_username;
            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: activeThread?.id === thread.id ? '1px solid #2563eb' : `1px solid ${theme.border}`,
                  backgroundColor: activeThread?.id === thread.id ? theme.accentSurface : theme.surface,
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontWeight: '700', color: theme.textStrong, fontSize: '0.95rem' }}>{counterpart}</div>
                <div style={{ color: theme.textMuted, fontSize: '0.85rem' }}>{thread.listing_title}</div>
                {thread.unread_count > 0 && (
                  <div style={{ marginTop: '6px', display: 'inline-block', backgroundColor: '#dc2626', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700' }}>
                    {thread.unread_count} unread
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div style={{ border: `1px solid ${theme.border}`, borderRadius: '12px', backgroundColor: theme.surface, padding: '12px' }}>
        {chatError && (
          <div style={{ marginBottom: '10px', color: '#991b1b', backgroundColor: '#fee2e2', borderRadius: '8px', padding: '8px 10px', fontSize: '0.9rem' }}>
            {chatError}
          </div>
        )}

        {!activeThread ? (
          <p style={{ margin: 0, color: theme.textMuted }}>Select a thread to view messages.</p>
        ) : (
          <>
            <div style={{ marginBottom: '8px', color: theme.text, fontWeight: '700' }}>
              Chat for listing: {activeThread.listing_title}
            </div>
            <div style={{ height: '450px', overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px', backgroundColor: theme.surfaceAlt }}>
              {chatMessages.length === 0 ? (
                <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.95rem' }}>No messages yet. Start the conversation.</p>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.sender_username === formData.username;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                      <div style={{ maxWidth: '75%', padding: '8px 10px', borderRadius: '10px', backgroundColor: isMine ? '#2563eb' : theme.border, color: isMine ? '#fff' : theme.textStrong, fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '0.72rem', opacity: 0.9, marginBottom: '2px' }}>{msg.sender_username}</div>
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder='Type message...'
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text }}
              />
              <button
                onClick={handleSendMessage}
                style={{ border: 'none', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', padding: '10px 14px', cursor: 'pointer', fontWeight: '600' }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const ListingBox = ({ item, isOwn }) => (
    <div style={{ border: `1px solid ${theme.border}`, padding: '1.5rem', borderRadius: '12px', backgroundColor: isOwn ? theme.accentSurface : theme.surface, marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: theme.textStrong, fontSize: '1.3rem' }}>{item.title}</h4>
        <span style={{ fontSize: '0.9rem', padding: '4px 12px', borderRadius: '12px', backgroundColor: theme.surfaceAlt, color: theme.textMuted, fontWeight: '700' }}>{item.category}</span>
      </div>

      <div style={{ fontSize: '1rem', color: theme.textMuted, marginBottom: '10px' }}>
        Condition: <strong style={{ color: theme.text }}>{item.condition}</strong> | Qty: <strong style={{ color: theme.text }}>{item.quantity}</strong>
      </div>

      <p style={{ color: theme.text, fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>{item.description}</p>

      {isOwn && item.approved && (
        <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: theme.surfaceAlt, borderRadius: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: theme.text, display: 'block', marginBottom: '6px' }}>Update Status:</label>
          <select
            value={item.status || 'ACTIVE'}
            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`, fontSize: '0.9rem', backgroundColor: theme.surface, color: theme.text, cursor: 'pointer' }}
          >
            <option value='ACTIVE'>Active - Visible to everyone</option>
            <option value='DELETED'>Deleted - Hidden from public</option>
          </select>
        </div>
      )}

      {isOwn && item.status !== 'REJECTED' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => handleEditListing(item)}
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
          >
            Edit Details
          </button>
          <button
            onClick={() => handleDeleteListing(item.id)}
            style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
          >
            Delete Listing
          </button>
          {item.approved && item.status === 'ACTIVE' && (
            <button
              onClick={() => handleCompleteDonation(item)}
              style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
            >
              Complete Donation
            </button>
          )}
        </div>
      )}

      {!isOwn && (
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ fontSize: '0.95rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span>Posted by:</span>
            <strong style={{ color: '#60a5fa' }}>{item.owner}</strong>
          </div>
          <button
            onClick={() => handleOpenChatForListing(item.id)}
            disabled={chatLoading}
            style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
          >
            {chatLoading ? 'Opening...' : 'Chat with Owner'}
          </button>
        </div>
      )}
    </div>
  );

  const DashboardPage = () => (
    <>
      {!showCreate ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2px 1fr', gap: '4rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: theme.textStrong }}>My Listings</h3>
              <button
                onClick={() => setShowCreate(true)}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }}
              >
                + Create New
              </button>
            </div>

            {myListings.map((item) => (
              <React.Fragment key={item.id}>{ListingBox({ item, isOwn: true })}</React.Fragment>
            ))}
            {myListings.length === 0 && <p style={{ fontSize: '1.2rem', color: theme.textMuted }}>No personal listings yet.</p>}
          </div>

          <div style={{ backgroundColor: theme.surfaceAlt, width: '100%', height: '100%', minHeight: '500px', borderRadius: '2px' }}></div>

          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', color: theme.textStrong }}>Community Marketplace</h3>

              <div style={{ backgroundColor: theme.surfaceAlt, padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: theme.text, fontWeight: '600' }}>Search & Filter</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type='text'
                    placeholder='Search listings...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, margin: 0, padding: '12px' }}
                  />
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ ...inputStyle, margin: 0, padding: '12px' }}>
                    <option value=''>All Categories</option>
                    <option value='Laptop'>Laptop</option>
                    <option value='Phone'>Phone</option>
                    <option value='Tablet'>Tablet</option>
                    <option value='Other'>Other</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} style={{ ...inputStyle, margin: 0, padding: '12px' }}>
                    <option value=''>All Conditions</option>
                    <option value='Excellent'>Excellent</option>
                    <option value='Good'>Good</option>
                    <option value='Fair'>Fair</option>
                    <option value='Poor'>Poor</option>
                  </select>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type='number'
                      placeholder='Min Qty'
                      min='0'
                      value={filterMinQty}
                      onChange={(e) => setFilterMinQty(e.target.value)}
                      style={{ ...inputStyle, margin: 0, padding: '12px', flex: 1 }}
                    />
                    <input
                      type='number'
                      placeholder='Max Qty'
                      min='0'
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

            {publicListings.map((item) => (
              <React.Fragment key={item.id}>{ListingBox({ item, isOwn: false })}</React.Fragment>
            ))}
            {publicListings.length === 0 && <p style={{ fontSize: '1.2rem', color: theme.textMuted }}>No listings match your filters.</p>}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
          <h3 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center' }}>{editingListingId ? 'Edit Listing' : 'Create New Listing'}</h3>
          <form onSubmit={handleCreateListing}>
            <label style={labelStyle}>Device Title</label>
            <input
              required
              placeholder='What are you listing?'
              style={inputStyle}
              value={newListing.title}
              onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={newListing.category} onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}>
                  <option value='Laptop'>Laptop</option>
                  <option value='Phone'>Phone</option>
                  <option value='Tablet'>Tablet</option>
                  <option value='Other'>Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Condition</label>
                <select style={inputStyle} value={newListing.condition} onChange={(e) => setNewListing({ ...newListing, condition: e.target.value })}>
                  <option value='Excellent'>Excellent</option>
                  <option value='Good'>Good</option>
                  <option value='Fair'>Fair</option>
                  <option value='Poor'>Poor</option>
                </select>
              </div>
            </div>

            <label style={labelStyle}>Quantity</label>
            <input
              type='number'
              required
              style={inputStyle}
              min='1'
              value={newListing.quantity}
              onChange={(e) => setNewListing({ ...newListing, quantity: parseInt(e.target.value, 10) || 1 })}
            />

            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={newListing.status} onChange={(e) => setNewListing({ ...newListing, status: e.target.value })}>
              <option value='ACTIVE'>Active - Visible to everyone</option>
              <option value='DELETED'>Deleted - Hidden from public</option>
            </select>

            <label style={labelStyle}>Description</label>
            <textarea
              required
              placeholder='Tell us about the device...'
              style={{ ...inputStyle, height: '150px' }}
              value={newListing.description}
              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
            />

            <div style={{ display: 'flex', gap: '20px', marginTop: '1.5rem' }}>
              <button
                type='submit'
                style={{ flex: 2, padding: '20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '700' }}
              >
                {editingListingId ? 'Update Listing' : 'Publish Listing'}
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowCreate(false);
                  setNewListing({ title: '', description: '', category: 'Laptop', condition: 'Good', quantity: 1, status: 'PENDING' });
                  setEditingListingId(null);
                }}
                style={{ flex: 1, padding: '20px', backgroundColor: theme.surfaceAlt, color: theme.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: '600' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  const DonationHistoryPage = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.9rem', color: theme.textStrong }}>Donation History</h3>
          <p style={{ margin: '0.35rem 0 0 0', color: theme.textMuted }}>
            Completed donations for <strong>{formData.username}</strong>
          </p>
        </div>
        <button
          onClick={fetchDonationHistory}
          style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surfaceAlt, color: theme.textStrong, borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: '600' }}
        >
          Refresh
        </button>
      </div>

      {donationHistory.length === 0 ? (
        <div style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surfaceAlt, borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: '1rem' }}>No donation history available.</p>
        </div>
      ) : (
        donationHistory.map((record) => (
          <div key={record.id} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: theme.textStrong, fontSize: '1.2rem' }}>{record.title}</h4>
              <span style={{ backgroundColor: theme.surfaceAlt, color: theme.textStrong, borderRadius: '999px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: '700' }}>
                Completed
              </span>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', color: theme.textMuted }}>{record.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: '0.2rem' }}>Category</div>
                <div style={{ color: theme.textStrong, fontWeight: '600' }}>{record.category}</div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: '0.2rem' }}>Condition</div>
                <div style={{ color: theme.textStrong, fontWeight: '600' }}>{record.condition}</div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: '0.2rem' }}>Receiver</div>
                <div style={{ color: theme.textStrong, fontWeight: '600' }}>{record.recipient_username || 'Unknown'}</div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: '0.2rem' }}>Completion Date</div>
                <div style={{ color: theme.textStrong, fontWeight: '600' }}>
                  {record.completed_at ? new Date(record.completed_at).toLocaleString() : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (isLoggedIn) {
    if (isAdmin) {
      return (
        <Admin
          username={formData.username}
          onLogout={logout}
          onAdminTransferComplete={handleAdminTransferComplete}
          themeMode={themeMode}
          onToggleTheme={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
        />
      );
    }

    return (
      <div style={pageWrapper}>
      <div style={logoStyle}>DeviceLink</div>
      {toastNotifications.length > 0 && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {toastNotifications.map((toast) => (
            <div key={toast.id} style={{ minWidth: '260px', maxWidth: '360px', backgroundColor: '#111827', color: '#fff', padding: '12px 14px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: '0.9rem', fontWeight: '600' }}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: '2rem', color: theme.textMuted, fontSize: '1.3rem' }}>
        Welcome, <strong>{formData.username}</strong>
      </div>

        <div style={cardStyle}>
          {HeaderNav()}
          {currentPage === 'chat' ? ChatPage() : currentPage === 'history' ? DonationHistoryPage() : DashboardPage()}
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <div style={logoStyle}>DeviceLink</div>
      <div style={{ ...cardStyle, maxWidth: '450px', minHeight: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
            style={{ cursor: 'pointer', border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.textStrong, borderRadius: '8px', padding: '8px 12px', fontWeight: '700', marginBottom: '1rem' }}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>{authView === 'login' ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleAuth(authView); }}>
          <input placeholder='Username' style={inputStyle} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          <input type='password' placeholder='Password' style={inputStyle} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <button
            type='submit'
            style={{ width: '100%', padding: '16px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: '600' }}
          >
            {authView === 'login' ? 'Enter Dashboard' : 'Create Account'}
          </button>
        </form>
        <p onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')} style={{ marginTop: '2rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '1.1rem', fontWeight: '500' }}>
          {authView === 'login' ? 'New here? Join the community' : 'Already a member? Log in'}
        </p>
      </div>
    </div>
  );
}

export default App;
