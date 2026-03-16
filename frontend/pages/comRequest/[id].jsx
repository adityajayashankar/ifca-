import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import Layout from "@/components/layout";
import api from "@/utils/apiSetup";
import toast from "react-hot-toast";

const ComRequests = () => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const comId = router.query.id;
  
  // State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRequests, setSelectedRequests] = useState(new Set());

  // Fetch user role and requests
  const fetchData = useCallback(async () => {
    if (!comId) {
      console.log('No comId available yet, skipping fetch');
      return;
    }
    
    console.log('Fetching data for comId:', comId);
    
    try {
      setLoading(true);
      
      // Fetch user role
      const roleRes = await api.get(`/community/${comId}/my-role`);
      console.log('Role response:', roleRes.data);
      if (roleRes.data.success) {
        const role = roleRes.data.data.role;
        console.log('User role:', role);
        setUserRole(role);
        
        // Only fetch requests if user is ADMIN or MODERATOR
        if (role === 'ADMIN' || role === 'MODERATOR') {
          console.log('Fetching requests for community:', comId);
          const requestsRes = await api.get(`/comRequest/${comId}`);
          console.log('Requests response:', requestsRes.data);
          if (requestsRes.data.success) {
            setRequests(requestsRes.data.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [comId]);

  useEffect(() => {
    // Only fetch data when router is ready and comId is available
    if (router.isReady && comId) {
      fetchData();
    }
  }, [router.isReady, comId, fetchData]);

  // Handle individual request approval
  const handleIndividualApprove = useCallback(async (item) => {
    const payload = [{
      requestId: item.id,
      userId: item.userId,
      communityId: item.communityId,
    }];

    try {
      const res = await api.put(`/comRequest/respond`, payload);
      if (res.success || res.data.success === true) {
        toast.success(res.data.message || "Request approved successfully!");
        // Trigger member list refresh in parent component
        window.dispatchEvent(new CustomEvent('membersChanged', { 
          detail: { communityId: comId } 
        }));
      } else {
        toast.error("Failed to approve request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while approving the request.");
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  // Handle bulk approval
  const handleBulkApprove = useCallback(async () => {
    if (selectedRequests.size === 0) {
      toast.warning('Please select requests to process');
      return;
    }

    const idsToApprove = Array.from(selectedRequests);
    const payload = idsToApprove.map((id) => {
      const req = requests.find((r) => r.id === id);
      return {
        requestId: req.id,
        userId: req.userId,
        communityId: req.communityId,
      };
    });

    try {
      const res = await api.put(`/comRequest/respond`, payload);
      if (res.success || res.data.success === true) {
        toast.success(res.data.message || "Requests approved successfully!");
        // Trigger member list refresh in parent component
        window.dispatchEvent(new CustomEvent('membersChanged', { 
          detail: { communityId: comId } 
        }));
      } else {
        toast.error("Some requests failed to approve.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during bulk approval.");
    }

    setSelectedRequests(new Set());
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [selectedRequests, requests]);

  // Toggle row expansion
  const toggleRow = useCallback((id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Checkbox change handler
  const handleCheckboxChange = useCallback((id) => {
    const updatedSelected = new Set(selectedRequests);
    if (updatedSelected.has(id)) {
      updatedSelected.delete(id);
    } else {
      updatedSelected.add(id);
    }
    setSelectedRequests(updatedSelected);
  }, [selectedRequests]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Check if user has permission
  if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view join requests.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="page-title">Community Requests</h1>
      <hr className="divider" />
      
      <div className="requests-container">
        <div className="requests-table">
          <div className="table-header">
            <div className="header-checkbox">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRequests(new Set(requests.map(row => row.id)));
                  } else {
                    setSelectedRequests(new Set());
                  }
                }}
                checked={requests.length > 0 && selectedRequests.size === requests.length}
              />
            </div>
            <div className="header-user">
              <span>User</span>
            </div>
            <div className="header-phone">
              <span>Phone</span>
            </div>
            <div className="header-actions">
              <span>Actions</span>
            </div>
          </div>

          {requests.length === 0 ? (
            <p className="no-requests">No Requests yet!!</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="table-row">
                <div className="row-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={() => handleCheckboxChange(request.id)}
                  />
                </div>
                <div className="row-user">
                  {request.unifiedUser?.user?.photoURL ? (
                    <img src={request.unifiedUser.user.photoURL} alt={request.name} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                  <div className="user-info">
                    <div className="user-name">{request.name || 'Unknown User'}</div>
                    <div className="user-email">{request.email || 'No email'}</div>
                  </div>
                </div>
                <div className="row-phone">
                  <span>{request.phone || 'No phone'}</span>
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-secondary btn-toggle"
                    onClick={() => toggleRow(request.id)}
                  >
                    {expandedRows[request.id] ? 'Hide' : 'Show Questions & Answers'}
                    <span className="toggle-icon">
                      {expandedRows[request.id] ? '▼' : '▶'}
                    </span>
                  </button>
                  <button
                    className="btn btn-success btn-approve"
                    onClick={() => handleIndividualApprove(request)}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
          
          {requests.length > 0 && requests.map((request) => {
            // Create questions array like admin-frontend
            console.log('Request data:', request);
            console.log('Community questions:', request.Community?.questions);
            console.log('Request answers:', { q1: request.q1, q2: request.q2, q3: request.q3 });
            
            const questions = [
              {
                question: request.Community?.questions?.[0] || 'Question 1',
                answer: request.q1,
              },
              {
                question: request.Community?.questions?.[1] || 'Question 2',
                answer: request.q2,
              },
              {
                question: request.Community?.questions?.[2] || 'Question 3',
                answer: request.q3,
              },
            ];

            return expandedRows[request.id] && (
              <div key={`expand-${request.id}`} className="expanded-content">
                <div className="questions-container">
                  {questions.map((q, index) => (
                    <div key={index} className="question-item">
                      <div className="question-text">{q.question}</div>
                      <div className="question-answer">{q.answer || 'No answer provided'}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bulk-actions">
          {selectedRequests.size > 0 && (
            <button className="btn btn-success btn-bulk" onClick={handleBulkApprove}>
              Approve Selected Requests
            </button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .page-title {
          margin: 16px 0 12px 20px;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .divider {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 100%);
          margin: 0 20px;
        }
        
        .requests-container {
          width: 96%;
          margin: 16px auto;
          overflow-x: auto;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
        
        .requests-table {
          min-width: 800px;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          overflow: hidden;
          background: white;
        }
        
        .table-header {
          display: flex;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid #dee2e6;
          padding: 12px 12px;
          font-weight: 600;
          color: #495057;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .header-checkbox {
          width: 5%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header-user {
          width: 25%;
          padding-left: 4px;
        }
        
        .header-phone {
          width: 20%;
          text-align: center;
        }
        
        .header-actions {
          width: 50%;
          display: flex;
          justify-content: flex-end;
          padding-right: 12px;
        }
        
        .table-row {
          display: flex;
          padding: 10px 12px;
          border-bottom: 1px solid #f1f3f4;
          align-items: center;
          transition: all 0.2s ease;
          background: white;
        }
        
        .table-row:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .row-checkbox {
          width: 5%;
          display: flex;
          justify-content: center;
        }
        
        .row-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #28a745;
        }
        
        .row-user {
          width: 25%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 4px;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e9ecef;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .user-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          font-size: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #212529;
        }
        
        .user-email {
          font-size: 12px;
          color: #6c757d;
          font-weight: 400;
        }
        
        .row-phone {
          width: 20%;
          text-align: center;
          font-size: 13px;
          color: #495057;
          font-weight: 500;
        }
        
        .row-actions {
          width: 50%;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          align-items: center;
          padding-right: 12px;
        }
        
        .btn {
          padding: 6px 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          color: white;
          border: 1px solid #5a6268;
        }
        
        .btn-secondary:hover {
          background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 8px 24px;
          height: 32px;
          border: 1px solid #20c997;
        }
        
        .btn-success:hover {
          background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
        }
        
        .btn-toggle {
          margin-right: 8px;
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
          color: white;
          border: 1px solid #138496;
          padding: 6px 12px;
          font-size: 12px;
        }
        
        .btn-toggle:hover {
          background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
        }
        
        .toggle-icon {
          font-size: 9px;
          font-weight: bold;
        }
        
        .expanded-content {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 12px 0 12px 60px;
          border-top: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
        }
        
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .question-item {
          background: white;
          padding: 10px 14px;
          border-radius: 6px;
          border-left: 3px solid #28a745;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .question-text {
          font-weight: 600;
          font-size: 13px;
          color: #495057;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .question-answer {
          font-size: 13px;
          color: #6c757d;
          line-height: 1.4;
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }
        
        .no-requests {
          margin: 24px 12px;
          font-size: 16px;
          text-align: center;
          color: #6c757d;
          font-weight: 500;
          padding: 24px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 2px dashed #dee2e6;
        }
        
        .bulk-actions {
          margin: 16px 12px;
          padding: 14px;
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
          border-radius: 6px;
          border: 1px solid #c3e6cb;
        }
        
        .btn-bulk {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid #20c997;
        }
        
        .btn-bulk:hover {
          background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
        }
        
        @media (max-width: 768px) {
          .requests-container {
            width: 100%;
            margin: 12px 6px;
            border-radius: 0;
          }
          
          .requests-table {
            min-width: 100%;
            border-radius: 0;
          }
          
          .table-header,
          .table-row {
            padding: 10px 8px;
          }
          
          .header-user {
            width: 30%;
          }
          
          .header-phone {
            width: 25%;
          }
          
          .header-actions {
            width: 45%;
          }
          
          .row-user {
            width: 30%;
          }
          
          .row-phone {
            width: 25%;
          }
          
          .row-actions {
            width: 45%;
            flex-direction: column;
            gap: 6px;
          }
          
          .btn-toggle {
            margin-right: 0;
            width: 100%;
            justify-content: center;
          }
          
          .btn-approve {
            width: 100%;
            justify-content: center;
          }
          
          .expanded-content {
            padding: 12px 0 12px 40px;
          }
        }
        
        @media (max-width: 480px) {
          .page-title {
            font-size: 1.5rem;
            margin: 12px 0 8px 16px;
          }
          
          .divider {
            margin: 0 16px;
          }
          
          .expanded-content {
            padding: 10px 0 10px 30px;
          }
          
          .question-item {
            padding: 8px 12px;
          }
          
          .btn {
            padding: 5px 10px;
            font-size: 12px;
          }
          
          .btn-success {
            padding: 6px 18px;
            height: 28px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ComRequests;
