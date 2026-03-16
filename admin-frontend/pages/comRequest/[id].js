import { fetchRequests, requests } from "@/store/features/requestSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Head from "next/head";
import { selectUser } from "@/store/features/userSlice";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

const Modal = ({ setModal, current, actionType, handleConfirm }) => {
  const handleYes = async () => {
    await handleConfirm(current);
    setModal(false);
  };

  const handleNo = () => {
    setModal(false);
  };

  return (
    <div className="modal-content">
      <h2 className="modal-title">
        Are you sure you want to {actionType} this request?
      </h2>
      <div className="modal-actions">
        <button
          className={`btn btn-${actionType === 'approve' ? 'success' : 'error'}`}
          onClick={handleYes}
        >
          Yes
        </button>
        <button className="btn btn-secondary" onClick={handleNo}>
          No
        </button>
      </div>
    </div>
  );
};

const ComRequests = () => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const userId = user?.unifiedUser?.id;
  const dispatch = useDispatch();
  const pendingReq = useSelector(requests);
  const [expandedRows, setExpandedRows] = useState({});
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState();
  const [actionType, setActionType] = useState('approve');
  const [selectedRequests, setSelectedRequests] = useState(new Set());

  const comId = router.query.id;

  const communityReq = pendingReq?.filter((req) => req.communityId === parseInt(comId));

  useEffect(() => {
    if (userId) dispatch(fetchRequests({ userId }));
  }, []);

  const handleModal = (item, type) => {
    setActionType(type);
    setModal(true);
    setCurrent(item);
  };

  useEffect(() => {
    if (modal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [modal]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCheckboxChange = (id) => {
    const updatedSelected = new Set(selectedRequests);
    if (updatedSelected.has(id)) {
      updatedSelected.delete(id);
    } else {
      updatedSelected.add(id);
    }
    setSelectedRequests(updatedSelected);
  };

  const handleBulkApprove = async () => {
    const idsToApprove = Array.from(selectedRequests);
    const payload = idsToApprove.map((id) => {
      const req = pendingReq.find((r) => r.id === id);
      return {
        requestId: req.id,
        userId: req.userId,
        communityId: req.communityId,
      };
    });

    try {
      const res = await api.put(`/comRequest/respond`, payload);
      if (res.success || res.data.success === true) {
        toast(`${res.data.message || "Requests approved successfully!"}`, { type: "success" });
      } else {
        toast("Some requests failed to approve.", { type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast("An error occurred during bulk approval.", { type: "error" });
    }

    setSelectedRequests(new Set());
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleIndividualApprove = async (item) => {
    const payload = [{
      requestId: item.id,
      userId: item.userId,
      communityId: item.communityId,
    }];

    try {
      const res = await api.put(`/comRequest/respond`, payload);
      if (res.success || res.data.success === true) {
        toast(`${res.data.message || "Request approved successfully!"}`, { type: "success" });
      } else {
        toast("Failed to approve request.", { type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast("An error occurred while approving the request.", { type: "error" });
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const rows = communityReq?.map((item, index) => ({
    id: item.id,
    requestId: item.id,
    userId: item.userId,
    communityId: item.communityId,
    name: item.name,
    email: item.email,
    phone: item.phone,
    photoUrl: item.photoUrl,
    communityName: item.Community?.title,
    communityBanner: item.Community?.bannerImg,
    questions: [
      {
        question: item.Community?.questions?.[0] || 'Question 1',
        answer: item.q1,
      },
      {
        question: item.Community?.questions?.[1] || 'Question 2',
        answer: item.q2,
      },
      {
        question: item.Community?.questions?.[2] || 'Question 3',
        answer: item.q3,
      },
    ],
  }));

  return (
    <>
      <Head>
        <title>Community Requests</title>
      </Head>
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
                      setSelectedRequests(new Set(rows.map(row => row.id)));
                    } else {
                      setSelectedRequests(new Set());
                    }
                  }}
                  checked={rows.length > 0 && selectedRequests.size === rows.length}
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

            {rows.length === 0 ? (
              <p className="no-requests">No Requests yet!!</p>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="table-row">
                  <div className="row-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRequests.has(row.id)}
                      onChange={() => handleCheckboxChange(row.id)}
                    />
                  </div>
                  <div className="row-user">
                    {row.photoUrl ? (
                      <img src={row.photoUrl} alt={row.name} className="user-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                    <div className="user-info">
                      <div className="user-name">{row.name}</div>
                      <div className="user-email">{row.email}</div>
                    </div>
                  </div>
                  <div className="row-phone">
                    <span>{row.phone}</span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn btn-secondary btn-toggle"
                      onClick={() => toggleRow(row.id)}
                    >
                      {expandedRows[row.id] ? 'Hide' : 'Show Questions & Answers'}
                      <span className="toggle-icon">
                        {expandedRows[row.id] ? '▼' : '▶'}
                      </span>
                    </button>
                    <button
                      className="btn btn-success btn-approve"
                      onClick={() => handleModal(row, 'approve')}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {rows.length > 0 && rows.map((row) => (
              expandedRows[row.id] && (
                <div key={`expand-${row.id}`} className="expanded-content">
                  <div className="questions-container">
                    {row.questions.map((q, index) => (
                      <div key={index} className="question-item">
                        <div className="question-text">{q.question}</div>
                        <div className="question-answer">{q.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
          
          <div className="bulk-actions">
            {selectedRequests.size > 0 && (
              <button className="btn btn-success btn-bulk" onClick={handleBulkApprove}>
                Approve Selected Requests
              </button>
            )}
          </div>
        </div>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <Modal
                setModal={setModal}
                current={current}
                actionType={actionType}
                handleConfirm={actionType === 'approve' ? handleIndividualApprove : null}
              />
            </div>
          </div>
        )}
      </Layout>
      
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
        
        .btn-error {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          border: 1px solid #c82333;
        }
        
        .btn-error:hover {
          background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
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
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .modal {
          background: white;
          border-radius: 8px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          max-width: 450px;
          width: 90%;
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-content {
          padding: 24px;
        }
        
        .modal-title {
          margin: 0 0 18px 0;
          font-size: 20px;
          font-weight: 600;
          color: #212529;
          text-align: center;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .modal-actions .btn {
          min-width: 80px;
          justify-content: center;
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
          
          .modal {
            width: 95%;
            margin: 16px;
          }
          
          .modal-content {
            padding: 20px;
          }
          
          .modal-actions {
            flex-direction: column;
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
    </>
  );
};

export default ComRequests; 