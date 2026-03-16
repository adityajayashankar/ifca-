import { fetchRequests, requests } from "@/store/features/requestSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Head from "next/head";
import { Box, Button, Typography, Modal as MuiModal, Avatar, Collapse, useMediaQuery, useTheme, Divider, Checkbox } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
    <Box sx={{ width: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Are you sure you want to {actionType} this request?
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color={actionType === 'approve' ? 'success' : 'error'}
          onClick={handleYes}
        >
          Yes
        </Button>
        <Button variant="contained" color="inherit" onClick={handleNo}>
          No
        </Button>
      </Box>
    </Box>
  );
};

const Requests = () => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const userId = user?.unifiedUser?.id;
  const dispatch = useDispatch();
  const pendingReq = useSelector(requests);
  const [expandedRows, setExpandedRows] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        <title>Requests</title>
      </Head>
      <Layout>
      <Typography variant="h4" sx={{ mt: 3, ml: 3, fontWeight: 700, mb: 2 }}>Requests</Typography>
      <Divider />
      <Box sx={{ width: '95%', mx: 'auto', mt: 3, overflowX: 'auto' }}>
        <Box sx={{
          minWidth: isMobile ? 600 : '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'flex',
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            p: 2,
            fontWeight: 'bold',
            display:'flex',
            justifyContent:'space-between',
          }}>
            <Box sx={{ width: '5%', display: 'flex', alignItems: 'center' }}>
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRequests(new Set(rows.map(row => row.id)));
                  } else {
                    setSelectedRequests(new Set());
                  }
                }}
                checked={rows.length > 0 && selectedRequests.size === rows.length}
              />
            </Box>
            <Box sx={{ width: '20%', mt:1 }}><Typography variant="subtitle1">User</Typography></Box>
            {/* <Box sx={{ width: '20%',  mt:1 }}><Typography variant="subtitle1">Community</Typography></Box> */}
            <Box sx={{ width: '15%', mt:1 }}><Typography variant="subtitle1">Phone</Typography></Box>
            <Box sx={{ width: '35%', display: 'flex', justifyContent: 'flex-end' }}>
              <Typography sx={{ width: '20%', mt:1, mr:3 }} variant="subtitle1">Actions</Typography>
            </Box>
          </Box>

          {rows.length === 0 ? (
            <p className="my-4 ml-4 text-2xl flex justify-center">No Requests yet!!</p>
          ) : (
            rows.map((row) => (
              <Box key={row.id}>
                <Box sx={{
                  display: 'flex',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <Box sx={{ width: '5%', mt:3 }}>
                    <Checkbox
                      checked={selectedRequests.has(row.id)}
                      onChange={() => handleCheckboxChange(row.id)}
                    />
                  </Box>
                  <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', gap: 1, mr:3 }}>
                    <Avatar src={row.photoUrl} alt={row.name} sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                    </Box>
                  </Box>
                  {/* <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={row.communityBanner} sx={{ width: 40, height: 40, borderRadius: 1 }} />
                    <Typography variant="body2">{row.communityName}</Typography>
                  </Box> */}
                  <Box sx={{ width: '15%', mt:3 }}>
                    <Typography variant="body2" sx={{marginTop:2}}>{row.phone}</Typography>
                  </Box>
                  <Box sx={{ width: '35%', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      sx={{marginRight:'20px'}}
                      size="small"
                      onClick={() => toggleRow(row.id)}
                      endIcon={expandedRows[row.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandedRows[row.id] ? 'Hide' : 'Show Questions & Answers'}
                    </Button>
                    <Button
                      sx={{paddingLeft:'30px', paddingRight:'30px', height: '40px', mt:2}}
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleModal(row, 'approve')}
                      // startIcon={<CheckCircleIcon />}
                    >
                      Approve
                    </Button>
                    {/* <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleModal(row, 'reject')}
                      startIcon={<CancelIcon />}
                    >
                      Reject
                    </Button> */}
                  </Box>
                </Box>
                {expandedRows[row.id] && (
                  <Collapse in={expandedRows[row.id]}>
                    <Box sx={{ pl: 5, pb: 2 }}>
                      {row.questions.map((q, index) => (
                        <Box key={index}>
                          <Typography variant="subtitle2">{q.question}</Typography>
                          <Typography variant="body2">{q.answer}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                )}
              </Box>
            ))
          )}
        </Box>
        <Box sx={{ mt: 2 }}>
          {selectedRequests.size > 0 && (
            <Button variant="contained" color="success" onClick={handleBulkApprove}>
              Approve Selected Requests
            </Button>
          )}
        </Box>
      </Box>

      {modal && <MuiModal open={modal} onClose={() => setModal(false)}>
        <Box sx={{
          width: 'auto',
          maxWidth: '600px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          ml:50,
          mt:30
        }}>
          <Modal
            setModal={setModal}
            current={current}
            actionType={actionType}
            handleConfirm={actionType === 'approve' ? handleIndividualApprove : null}
          />
        </Box>
      </MuiModal>}
      </Layout>
    </>
  );
};

export default Requests;
