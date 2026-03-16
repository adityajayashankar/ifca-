import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Poll as PollIcon, Close as CloseIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import api from '@/utils/apiSetup';

const modalRoot = typeof window !== 'undefined' ? document.body : null;

const PollVotersModal = ({ open, onClose, postId, totalVotes }) => {
  const [pollVotes, setPollVotes] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'analytics'

  useEffect(() => {
    if (open && postId) {
      fetchPollVoters();
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

  const fetchPollVoters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/thread/${postId}/poll-voters`, {
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
      
      console.log("Poll voters response:", response.data);
      
      // Handle both direct data and nested data structure
      let votesData;
      if (response.data && response.data.data) {
        votesData = response.data.data.pollVotes || response.data.pollVotes || [];
        setPollQuestion(response.data.data.pollQuestion || response.data.pollQuestion || '');
      } else if (response.data && response.data.pollVotes) {
        votesData = response.data.pollVotes;
        setPollQuestion(response.data.pollQuestion || '');
      } else if (Array.isArray(response.data)) {
        votesData = response.data;
        setPollQuestion('');
      } else {
        votesData = [];
        setPollQuestion('');
      }
      
      console.log("Processed poll votes data:", votesData);
      setPollVotes(votesData);
    } catch (err) {
      console.error("Error fetching poll voters:", err);
      setError('Failed to load poll voters');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPollVotes([]);
    setPollQuestion('');
    setError(null);
    setViewMode('list');
    onClose();
  };

  // Calculate analytics data
  const getAnalyticsData = () => {
    if (!pollVotes.length) return [];
    
    return pollVotes.map(option => ({
      optionText: option.optionText,
      voteCount: option.voters.length,
      percentage: totalVotes > 0 ? Math.round((option.voters.length / totalVotes) * 100) : 0,
      voters: option.voters
    }));
  };

  const analyticsData = getAnalyticsData();

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
        minWidth: 500,
        maxWidth: 700,
        width: '90%',
        maxHeight: '85vh',
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
                         <PollIcon style={{ color: '#4CAF50', fontSize: 20 }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              {pollQuestion && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  {pollQuestion.length > 50 ? `${pollQuestion.substring(0, 50)}...` : pollQuestion}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0
          }}>
            <CloseIcon style={{ fontSize: 22 }} />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #eee',
          padding: '8px 24px'
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'list' ? '#4CAF50' : '#f5f5f5',
              color: viewMode === 'list' ? 'white' : '#666',
              borderRadius: '6px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Voter List
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'analytics' ? '#FF9800' : '#f5f5f5',
              color: viewMode === 'analytics' ? 'white' : '#666',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <BarChartIcon style={{ fontSize: 16, marginRight: 4 }} />
            Analytics
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 0 24px',
          minHeight: 200,
          maxHeight: 500
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#e53935' }}>
              <span>{error}</span>
            </div>
          ) : pollVotes.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#888' }}>
              <span>No votes yet</span>
            </div>
          ) : viewMode === 'list' ? (
            // Voter List View
            <div style={{ padding: '16px 0' }}>
              {pollVotes.map((option) => (
                <div key={option.optionId} style={{ marginBottom: 24 }}>
                  {/* Option Header */}
                  <div style={{
                    background: '#f8f9fa',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: 12,
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>
                        {option.optionText}
                      </span>
                      <span style={{ 
                        background: '#4CAF50', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: 12, 
                        fontWeight: '500' 
                      }}>
                        {option.voters.length} {option.voters.length === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Voters List */}
                  <div style={{ paddingLeft: 16 }}>
                    {option.voters.map((voter) => (
                      <div key={voter.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <img
                          src={voter.userPhoto}
                          alt={voter.userName}
                                                     style={{
                             width: 40, height: 40, borderRadius: '50%',
                             marginRight: 16, border: '2px solid #4CAF50', objectFit: 'cover'
                           }}
                          onError={(e) => {
                            e.target.src = '/t6.svg';
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 2 }}>
                            {voter.userName}
                          </div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            Voted for: <span style={{ fontWeight: 500, color: '#4CAF50' }}>{option.optionText}</span>
                          </div>
                          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                            {formatDistanceToNow(new Date(voter.votedAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Analytics View
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 16 }}>
                  Poll Results Analytics
                </h3>
                
                {analyticsData.map((option, index) => (
                  <div key={index} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 14, color: '#333', flex: 1 }}>
                        {option.optionText}
                      </span>
                      <span style={{ fontSize: 14, color: '#666', marginLeft: 16 }}>
                        {option.voteCount} votes ({option.percentage}%)
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: 24,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 12,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${option.percentage}%`,
                        height: '100%',
                        backgroundColor: index % 2 === 0 ? '#4CAF50' : '#FF9800',
                        transition: 'width 0.3s ease',
                        borderRadius: 12
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: option.percentage > 50 ? 'white' : '#333',
                        fontSize: 12,
                        fontWeight: '600'
                      }}>
                        {option.percentage}%
                      </div>
                    </div>
                    
                    {/* Voter Names */}
                    {option.voters.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 8 }}>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          Voters: {option.voters.map(v => v.userName).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Summary Stats */}
                <div style={{
                  background: '#f8f9fa',
                  padding: 16,
                  borderRadius: 8,
                  marginTop: 20,
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                    Summary
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: '#666' }}>Total Votes:</span>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{totalVotes}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: '#666' }}>Options:</span>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{pollVotes.length}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: '#666' }}>Most Popular:</span>
                                             <div style={{ fontSize: 14, fontWeight: 500, color: '#4CAF50' }}>
                         {analyticsData.length > 0 ? analyticsData[0].optionText : 'N/A'}
                       </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: '#666' }}>Highest %:</span>
                                             <div style={{ fontSize: 14, fontWeight: 500, color: '#FF9800' }}>
                         {analyticsData.length > 0 ? `${analyticsData[0].percentage}%` : 'N/A'}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            padding: '8px 20px',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default PollVotersModal;

