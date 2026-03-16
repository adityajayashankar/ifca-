import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, Divider } from "@mui/material";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { styled } from "@mui/material/styles";

const StagesTabs = () => {
  const router = useRouter();
  const { id } = router.query;

  const [stagesData, setStagesData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    "&.MuiTableCell-head": {
      backgroundColor: "#2F4266",
      color: theme.palette.common.white,
    },
    "&.MuiTableCell-body": {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  useEffect(() => {
    if (id) getSubmissions();
  }, [id]);

  const getSubmissions = async () => {
    try {
      const res = await api.get(`/competitions/getSubmissionsForCreator/${id}`);
      console.log("Submissions Response:", res.data);

      const stageMap = new Map();

      res.data.forEach(({ stage, userId, evaluations, evaluatorResult, competitionName, name, email }) => {
        if (!stageMap.has(stage.stageNumber)) {
          stageMap.set(stage.stageNumber, {
            ...stage,
            competitionName,
            submissions: [],
            name, 
            email,
          });
        }
        stageMap.get(stage.stageNumber).submissions.push({
          userId,
          evaluations,
          evaluatorResult,
          name, 
          email,
        });
      });

      setStagesData(Array.from(stageMap.values()));
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  if (stagesData.length === 0) {
    return <Typography style={{marginLeft:'10px', marginTop:'10px', fontSize:20}}>No Submissions Yet</Typography>;
  }

  console.log('stagesData', stagesData[activeTab])

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography style={{marginLeft:'10px', fontSize:22, fontWeight:700}}>Submissions</Typography>
      <Divider style={{marginTop:4}}/>
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Stages Tabs"
      >
        {stagesData.map((stage) => (
          <Tab key={stage.stageNumber} label={`Stage ${stage.stageNumber}`} />
        ))}
      </Tabs>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell align="left" width={100}>Sl no.</StyledTableCell>
              <StyledTableCell align="left">User Name</StyledTableCell>
              <StyledTableCell align="left">Stage Number</StyledTableCell>
              <StyledTableCell align="left">Message</StyledTableCell>
              <StyledTableCell align="left">Evaluator Email</StyledTableCell>
              <StyledTableCell align="left">status</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stagesData[activeTab]?.submissions.map((submission, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell align="left">{index + 1}</StyledTableCell>
                <StyledTableCell align="left">{submission?.name}</StyledTableCell>
                <StyledTableCell align="left">{stagesData[activeTab].stageNumber}</StyledTableCell>
                <StyledTableCell align="left">
                  {submission?.evaluations[0]?.feedback || "No message"}
                </StyledTableCell>
                <StyledTableCell align="left">
                  {submission?.evaluations[0]?.evaluatorEmail || "N/A"}
                </StyledTableCell>
                <StyledTableCell align="left">
                  <p className="font-semibold">{submission?.evaluations[0]?.status || "N/A"}</p>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StagesTabs;
