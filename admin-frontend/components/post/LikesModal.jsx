import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Favorite as FavoriteIcon, Close as CloseIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import api from '@/utils/apiSetup';

const modalRoot = typeof window !== 'undefined' ? document.body : null;

const LikesModal = ({ open, onClose, postId, likeCount }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && postId) {
      fetchLikes();
    }
    // Prevent background scroll when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/thread/${postId}/likes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        // Force fresh data to avoid 304 cache issues
        forceRefresh: true,
        // Add cache-busting parameter
        params: {
          _t: Date.now()
        }
      });
      
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      
      // Handle both direct data and nested data structure
      let likesData;
      if (response.data && response.data.data) {
        likesData = response.data.data.likes || response.data.likes || [];
      } else if (response.data && response.data.likes) {
        likesData = response.data.likes;
      } else if (Array.isArray(response.data)) {
        likesData = response.data;
      } else {
        likesData = [];
      }
      
      console.log("Processed likes data:", likesData);
      setLikes(likesData);
    } catch (err) {
      console.error("Error fetching likes:", err);
      setError('Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLikes([]);
    setError(null);
    onClose();
  };

  if (!open || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        minWidth: 340,
        maxWidth: 420,
        width: '90%',
        maxHeight: '80vh',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #eee',
          padding: '18px 24px 12px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FavoriteIcon style={{ color: '#e91e63', fontSize: 20 }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}>
            <CloseIcon style={{ fontSize: 22 }} />
          </button>
        </div>
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 0 24px',
          minHeight: 180,
          maxHeight: 350
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180, color: '#e53935' }}>
              <span>{error}</span>
            </div>
          ) : likes.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180, color: '#888' }}>
              <span>No likes yet</span>
            </div>
          ) : (
            likes.map((like) => (
              <div key={like.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f5f5f5'
              }}>
                <img
                  src={like.userPhoto}
                  alt={like.userName}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    marginRight: 16, border: '2px solid #e91e63', objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>{like.userName}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    Liked {formatDistanceToNow(new Date(like.likedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Footer */}
        <div style={{
          borderTop: '1px solid #eee',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={handleClose} style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            background: '#fff',
            color: '#333',
            fontSize: 14,
            padding: '6px 18px',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default LikesModal;





