import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export default function FormResponses() {
  const router = useRouter();
  const typeformToken = process.env.NEXT_PUBLIC_TYPEFORM_TOKEN;

  const { Id } = router.query;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [questions, setQuestions] = useState({});
  const [responses, setResponses] = useState([]);
  const [responseObjects, setResponseObjects] = useState([]);
  const fetchFormResponses = async () => {
    // const formId = id; // Replace with your actual form ID

    const corsProxy = "https://cors-anywhere.herokuapp.com/";
    const typeformUrl = `https://api.typeform.com/forms/${Id}`;
    const typeformUrlRes = `https://api.typeform.com/forms/${Id}/responses`;
    if (!typeformToken) {
      console.error("Missing NEXT_PUBLIC_TYPEFORM_TOKEN");
      return;
    }
    try {
      const response = await axios.get(corsProxy + typeformUrl, {
        headers: {
          Authorization: `Bearer ${typeformToken}`,
        },
      });

      const FormResponse = await axios.get(corsProxy + typeformUrlRes, {
        headers: {
          Authorization: `Bearer ${typeformToken}`,
        },
      });

      // console.log("Form Responses:", response.data);
      // console.log("Form Responses Answer:", FormResponse.data);

      setResponses(FormResponse.data.items);
      //   const { items } = response.data;

      //     items.forEach((item) => {
      //       console.log(`Response ID: ${item.response_id}`);

      //       item.answers.forEach((answer) => {
      //         console.log(`Question ID: ${answer.field.id}`);
      //         console.log(`Question Type: ${answer.field.type}`);
      //         console.log(`Answer: ${answer[answer.type]}`);
      //       });

      //       console.log("---");
      //     });

      const questionMap = {};
      response.data.fields.forEach((field) => {
        questionMap[field.id] = field.title; 
      });
      setQuestions(questionMap);
      console.log(questionMap);
    } catch (error) {
      console.error("Error fetching form responses:", error);
    }
  };

  useEffect(() => {
    fetchFormResponses();
  }, []);
  useEffect(() => {
    if (responses.length > 0 && Object.keys(questions).length > 0) {

      const groupedResponses = responses.reduce((acc, response) => {
        if (!acc[response.response_id]) {
          acc[response.response_id] = [];
        }
        response.answers.forEach((answer) => {
          const questionText = questions[answer.field.id] || "Unknown Question";


          let answerText;
          if (typeof answer[answer.type] === "object") {
            answerText = Array.isArray(answer[answer.type])
              ? answer[answer.type].join(", ") 
              : JSON.stringify(answer[answer.type]);
          } else {
            answerText = answer[answer.type];
          }

          acc[response.response_id].push({
            question: questionText,
            answer: answerText,
          });
        });
        return acc;
      }, {});


      const formattedResponses = Object.entries(groupedResponses).map(
        ([responseId, answers]) => ({
          user_id: responseId,
          answers: answers,
        })
      );

      setResponseObjects(formattedResponses);
    }
  }, [responses, questions]);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBack = () => {
    router.back(); 
  };
  return (
    <section>
      <Box sx={{ width: "100%", overflowX: "auto", padding: 2 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          {" "}
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          Form Responses
        </Typography>
        <TableContainer component={Paper}>
          <Table aria-label="form responses table">
            <TableHead>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Answer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {responseObjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((response, index) =>
                  response.answers.map((answer, ansIndex) => (
                    <TableRow key={`${response.user_id}-${ansIndex}`}>
                      {ansIndex === 0 && (
                        <TableCell
                          sx={{
                            textAlign: "center",
                            verticalAlign: "top",
                            fontWeight: "bold",
                            borderRight: "1px solid #ddd",
                          }}
                          rowSpan={response.answers.length}
                        >
                          {index + 1}
                        </TableCell>
                      )}
                      <TableCell>{answer.question}</TableCell>
                      <TableCell>{answer.answer}</TableCell>
                    </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={responseObjects.reduce(
            (sum, item) => sum + item.answers.length,
            0
          )}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ mt: 2 }}
        />
      </Box>
    </section>
  );
}
