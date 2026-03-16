import React, { useEffect, useState } from "react";
import { Button, TextField, Grid, Card, CardContent, Typography, Modal, Box, Stack, Paper, Divider, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio, List, ListItem, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from "@mui/material";
import axios from "axios";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { toast } from "react-toastify";
import CloseIcon from '@mui/icons-material/Close';

const EvaluationPage = () => {
  const user = useSelector(selectUser);
  const [stages, setStages] = useState([]); 
  const [selectedStage, setSelectedStage] = useState(null); 
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState("");


  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/competitions/getResponsesForEvaluator/${user?.unifiedUser?.id}`);
      console.log("Fetched stages data:", res.data.stages);
      setStages(res.data.stages);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
      setLoading(false);
    }
  };

  const handleScoreChange = (e) => setScore(e.target.value);

  const handleFeedbackChange = (e) => setFeedback(e.target.value);

  const handlePromoteChange = (event) => {
    setSelectedOption(event.target.value);
  };


  const handleSubmit = async () => {

    console.log('selected user at submit', selectedStage?.submittedBy)
      const data = {
        evaluatorId: user?.unifiedUser?.id,
        stageId: selectedStage.stageId,
        score,
        feedback,
        status:selectedOption,
        userId: selectedStage?.submittedBy,
        competitionId: selectedStage?.competitionId
      }

      await api.post("/competitions/submitEvaluatorResponse", data)
      .then((res)=>{
        console.log('res', res)
        toast.success('Evaluation submitted successfully')
        setSelectedStage(null)
      })
      .catch((err)=>{
        console.log('err', err)
        if(err.status === 400) {
          setSelectedStage(null)
        } else {
        toast.error('Something went wrong')
        }
      })
  };

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
  };

  const handleCloseModal = () => {
    setSelectedStage(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log('stages---', stages)
  console.log('selectedstages---', selectedStage)

  return (
    <div style={{ padding: "20px", marginTop: "25px" }}>
      <Typography variant="h5" style={{marginBottom:'5px', fontWeight:700, fontSize:30}}>
        Competition Evaluation
      </Typography>
      <Divider />
      <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 3, overflow: "auto" }}>
        <Table>
          <TableHead sx={{ background: "#eceff1" }}>
            <TableRow>
              <TableCell><Typography fontWeight="bold">Competition Name</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Stage No</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Submitted By</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Action</Typography></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {stages?.length !== 0 ? (
              stages?.map((stage) => (
                <TableRow key={stage.id} hover>
                  <TableCell style={{fontSize:18}}>{stage.competitionTitle || "N/A"}</TableCell>
                  <TableCell style={{fontSize:18}}>{stage.stageNumber}</TableCell>
                  <TableCell style={{fontSize:18}}>{stage.user?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      onClick={() => handleStageClick(stage)}
                      sx={{ borderRadius: 2, backgroundColor:'#2563EB' }}
                    >
                      Click Here to Evaluate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No submissions yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
  open={selectedStage !== null}
  onClose={handleCloseModal}
  aria-labelledby="stage-responses-modal"
  aria-describedby="modal-to-view-responses-and-enter-feedback"
>
  <Box sx={modalStyle}>
    <IconButton
      onClick={handleCloseModal}
      sx={{
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#f5f5f5",
        "&:hover": { backgroundColor: "#e0e0e0" },
      }}
    >
      <CloseIcon />
    </IconButton>

    <Box sx={{ maxHeight: "80vh", overflowY: "auto", pr: 2, pb: 2 }}>
      <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
        Responses for Stage {selectedStage?.stageNumber}
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        {selectedStage?.fields?.map((response, idx) => {
          let answerContent = response?.response?.answer || "No response provided";

          try {
            const parsedAnswer = JSON.parse(answerContent);
            if (Array.isArray(parsedAnswer)) {
              answerContent = (
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                  {parsedAnswer.map((item, index) => (
                    <li key={index} style={{ listStyleType: "disc" }}>{item}</li>
                  ))}
                </ul>
              );
            }
          } catch (error) {
            console.log('error', error);
          }

          return (
            <Paper key={idx} sx={{ p: 3, borderRadius: 2 }}>
              <Typography fontWeight="bold">Question: {response.question}</Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection:
                    response.response?.fileType === "image" ||
                    response.response?.fileType === "video" ||
                    response.response?.fileType === "application"
                      ? "column"
                      : "row", 
                  alignItems: "start",
                  gap: 2,
                }}
              >
                <Typography fontWeight="bold">Answer:</Typography>

                {response.response?.fileType === "image" ? (
                  <img
                    src={response.response.answer}
                    alt="Uploaded"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                ) : response.response?.fileType === "video" ? (
                  <video controls style={{ width: "100%" }}>
                    <source src={response.response.answer} type="video/mp4" />
                  </video>
                ) : response.response?.fileType === "application" ? (
                  <iframe src={response.response.answer} width="100%" height="400px" />
                ) : (
                  <Typography>{answerContent}</Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <TextField 
        label="Score" 
        variant="outlined" 
        fullWidth 
        value={score} 
        onChange={handleScoreChange} 
        sx={{ mb: 2 }} 
      />
      <TextField 
        label="Feedback" 
        variant="outlined" 
        fullWidth 
        multiline 
        rows={4} 
        value={feedback} 
        onChange={handleFeedbackChange} 
        sx={{ mb: 3 }} 
      />

      <FormControl component="fieldset">
        <FormLabel component="legend">Promote candidate to next stage?</FormLabel>
        <RadioGroup value={selectedOption} onChange={handlePromoteChange}>
          <FormControlLabel value="QUALIFIED" control={<Radio color="primary" />} label="Qualified" />
          <FormControlLabel value="NOT_QUALIFIED" control={<Radio color="primary" />} label="Not Qualified" />
        </RadioGroup>
      </FormControl>
    </Box>

    <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, width: "100%" }}>
      Submit Evaluation
    </Button>
  </Box>
</Modal>


    </div>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800, 
  height: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
};



export default EvaluationPage;
