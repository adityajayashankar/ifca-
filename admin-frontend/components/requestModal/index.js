"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Head from "next/head";
import {
  Box,
  Button,
  Typography,
  Modal as MuiModal,
  Avatar,
  Collapse,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import api from "@/utils/apiSetup";
import { fetchRequests, requests } from "@/store/features/requestSlice";
import { selectUser } from "@/store/features/userSlice";

const ConfirmationModal = ({ setModal, current, actionType }) => {
  const handleYes = async () => {
    const res = await api.put(`/requests/respond/${current.requestId}`, {
      communityId: current.communityId,
      userId: current.userId,
    });

    if (res.success || res.data.success === true) {
      toast(`${res.data.message}`, { type: "success" });
      setModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast("Failed while updating request", { type: "error" });
    }
  };

  return (
    <Box sx={{ width: 600, p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Are you sure you want to {actionType} this request?
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color={actionType === "approve" ? "success" : "error"}
          onClick={handleYes}
        >
          Yes
        </Button>
        <Button variant="contained" color="inherit" onClick={() => setModal(false)}>
          No
        </Button>
      </Box>
    </Box>
  );
};

const RequestModal = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userId = user?.unifiedUser?.id;
  const pendingReq = useSelector(requests);
  const [expandedRows, setExpandedRows] = useState({});
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [actionType, setActionType] = useState("approve");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (userId) dispatch(fetchRequests({ userId }));
  }, [userId]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", modal);
  }, [modal]);

  const handleModal = (item, type) => {
    setActionType(type);
    setModal(true);
    setCurrent(item);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const rows = pendingReq?.map((item, index) => ({
    id: index + 1,
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
      { question: item.Community?.questions?.[0] || "Question 1", answer: item.q1 },
      { question: item.Community?.questions?.[1] || "Question 2", answer: item.q2 },
      { question: item.Community?.questions?.[2] || "Question 3", answer: item.q3 },
    ],
  }));

  return (
    <>
      <Head>
        <title>Requests</title>
      </Head>

      <Typography variant="h4" sx={{ mt: 3, ml: 3, fontWeight: 700, mb: 2 }}>
        Requests
      </Typography>
      <Divider />

      <Box sx={{ width: "95%", mx: "auto", mt: 3, overflowX: "auto" }}>
        <Box
          sx={{
            minWidth: isMobile ? 600 : "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              bgcolor: "background.paper",
              borderBottom: "1px solid",
              borderColor: "divider",
              p: 2,
              fontWeight: "bold",
            }}
          >
            <Box sx={{ width: "25%" }}>
              <Typography variant="subtitle2">User</Typography>
            </Box>
            <Box sx={{ width: "25%" }}>
              <Typography variant="subtitle2">Community</Typography>
            </Box>
            <Box sx={{ width: "15%" }}>
              <Typography variant="subtitle2">Phone</Typography>
            </Box>
            <Box sx={{ width: "35%", display: "flex", justifyContent: "flex-end" }}>
              <Typography variant="subtitle2">Actions</Typography>
            </Box>
          </Box>

          {rows?.length === 0 ? (
            <Typography className="my-4 ml-4 text-2xl flex justify-center">
              No Requests yet!!
            </Typography>
          ) : (
            rows.map((row) => (
              <Box key={row.id}>
                <Box
                  sx={{
                    display: "flex",
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ width: "25%", display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={row.photoUrl} alt={row.name} sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: "25%", display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={row.communityBanner}
                      alt={row.communityName}
                      sx={{ width: 40, height: 40, borderRadius: 1 }}
                    />
                    <Typography variant="body2">{row.communityName}</Typography>
                  </Box>

                  <Box sx={{ width: "15%", display: "flex", alignItems: "center" }}>
                    <Typography variant="body2">{row.phone}</Typography>
                  </Box>

                  <Box sx={{ width: "35%", display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => toggleRow(row.id)}
                      endIcon={expandedRows[row.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expandedRows[row.id] ? "Hide" : "Show Questions & Answers"}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleModal(row, "approve")}
                      startIcon={<CheckCircleIcon />}
                    >
                      Approve
                    </Button>
                  </Box>
                </Box>

                <Collapse in={expandedRows[row.id]}>
                  <Box sx={{ p: 2, bgcolor: "background.default" }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
                      Community joining Questions
                    </Typography>
                    {row.questions.map((q, i) => (
                      <Box key={i} sx={{ p: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: "16px" }}>
                          {i + 1}. {q.question}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "16px", pl: 1 }}
                        >
                          Answer: {q.answer}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            ))
          )}
        </Box>
      </Box>

      <MuiModal
        open={modal}
        onClose={() => setModal(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ bgcolor: "background.paper", borderRadius: 1, boxShadow: 24 }}>
          <ConfirmationModal setModal={setModal} current={current} actionType={actionType} />
        </Box>
      </MuiModal>
    </>
  );
};

export default RequestModal;
