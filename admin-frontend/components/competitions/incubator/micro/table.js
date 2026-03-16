import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Modal } from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

const columns = [
  { id: "name", label: "Name", minWidth: 170 },
  { id: "code", label: "ISO\u00a0Code", minWidth: 100 },
  {
    id: "population",
    label: "Population",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "size",
    label: "Size\u00a0(km\u00b2)",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "density",
    label: "Density",
    minWidth: 170,
    align: "right",
    format: (value) => value.toFixed(2),
  },
];

function createData(name, code, population, size) {
  const density = population / size;
  return { name, code, population, size, density };
}

// const rows = [
//   createData("India", "IN", 1324171354, 3287263),
//   createData("China", "CN", 1403500365, 9596961),
//   createData("Italy", "IT", 60483973, 301340),
//   createData("United States", "US", 327167434, 9833520),
//   createData("Canada", "CA", 37602103, 9984670),
//   createData("Australia", "AU", 25475400, 7692024),
//   createData("Germany", "DE", 83019200, 357578),
//   createData("Ireland", "IE", 4857000, 70273),
//   createData("Mexico", "MX", 126577691, 1972550),
//   createData("Japan", "JP", 126317000, 377973),
//   createData("France", "FR", 67022000, 640679),
//   createData("United Kingdom", "GB", 67545757, 242495),
//   createData("Russia", "RU", 146793744, 17098246),
//   createData("Nigeria", "NG", 200962417, 923768),
//   createData("Brazil", "BR", 210147125, 8515767),
// ];

export default function StickyHeadTable({
  rows,
  columns,
  ActionButton,
  competition,
}) {

  console.log('columns---', columns)
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const [ViewEvaluationDetails, setViewEvaluationDetails] =
    React.useState(null);
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow className="bg-gray-400">
              <TableCell key={"id"}>Slno.</TableCell>

              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell key={"view"}>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {columns.map((column) => {
                      const value = row[column.id];
                      if (column.id === "user") {
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {value?.name || value?.email}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.id === "assignedTo" ||
                          column.id === "evaluatedby" ? (
                            <div className="grid grid-cols-2 gap-y-4 w-fit">
                              {value?.map((item) => (
                                <span className="mx-2 w-fit border rounded-full p-2 py-1 text-sm">
                                  {item}
                                </span>
                              ))}
                              {/* {JSON.stringify(value)} */}
                            </div>
                          ) : (
                            value
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {/* <ViewEvaluationButton row={row} /> */}
                      <span
                        className="text-white bg-actionbtnBlue px-4 py-3 rounded cursor-pointer hover:scale[102%]"
                        onClick={() => {
                          setViewEvaluationDetails({
                            visible: true,
                            data: { row },
                          });
                        }}
                      >
                        View Evaulation
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      {ViewEvaluationDetails ? (
        <ViewEvaluationModal
          details={ViewEvaluationDetails}
          setdetails={setViewEvaluationDetails}
          competition={competition}
        />
      ) : (
        <></>
      )}
    </Paper>
  );
}

const ViewEvaluationModal = ({ details, setdetails, competition }) => {
  const services = useStateStore((state) => state.services);

  const moveToNextStage = () => {
    services.competition
      .movetoNextRound(
        competition.competition_id,
        details.data.row.submission_id
      )
      .then((res) => {
        if (res.status) {
          window.location.reload();
        } else {
          errorToast(res.errorMessage);
        }
      });
  };

  return (
    <Modal
      open={details.visible}
      onClose={() => {
        setdetails(null);
      }}
    >
      <div className="absolute inset-10 bg-white p-5 rounded overflow-y-scroll ">
        <p className="text-lg font-semibold antialiased text-headingColor border-b-2 pb-1">
          User Submission and Evaluation Details
        </p>

        <div className="py-4 flex flex-col gap-4">
          {competition.stages.map((stage, index) => {
            return (
              <div className="grid grid-cols-2 gap-5">
                {/* {JSON.stringify(stage)} */}
                <div className="border shadow p-4 rounded">
                  <p className="text-xl pb-2 mb-2 border-b-2">
                    {index === 0 ? "Application Round" : `Stage -${index + 1}`}
                  </p>
                  <div className="flex flex-col gap-4">
                    {stage.fields.map((question) => {
                      return (
                        <Info2
                          question={question}
                          stageResponse={details.data.row.responses[index]}
                        />
                      );
                    })}
                    {details.data.row.responses[index] ? (
                      <></>
                    ) : (
                      <>No Submission from user</>
                    )}
                  </div>
                </div>
                <div className="border shadow p-4 rounded">
                  <p className="text-xl pb-2 mb-2 border-b-2">
                    Evaluator Questions
                  </p>
                  <div className="flex flex-row justify-end">
                    <span className="text-sm py-2 ">
                      {
                        details.data.row.evaluation.filter(
                          (item) => item.stage_id === stage.stage_id
                        ).length
                      }{" "}
                      of {stage.evaluators.length}{" "}
                      {stage.evaluators.length === 1
                        ? "evaluation done"
                        : "evaluations are done"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {details.data.row.evaluation
                      .filter((item) => item.stage_id === stage.stage_id)
                      .map((evaulation) => {
                        return (
                          <div className="flex flex-col gap-3 border rounded ">
                            <p className="border-b-2 p-2 bg-gray-50">
                              Evaluator: {evaulation.evaluator}
                            </p>
                            {stage.evaluatorQuestion.map((item) => {
                              return (
                                <div className="flex flex-col gap-2 p-3 pt-1">
                                  <p className="font-semibold capitalize">
                                    {item.question}
                                  </p>
                                  <p className="p-2 border rounded">
                                    {
                                      details.data.row.evaluation[index][
                                        item.question_id
                                      ]
                                    }
                                  </p>
                                </div>
                              );
                            })}
                            {evaulation?.score ? (
                              <div className="p-3 pt-0">
                                <p>Score</p>
                                <p className="p-2 border rounded">
                                  {evaulation.score}
                                </p>
                              </div>
                            ) : null}
                            <div className="p-3 pt-0">
                              <p>Comments</p>
                              <p className="p-2 border rounded">
                                {evaulation.comments}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    {details.data.row.evaluation.length === 0 ? (
                      <p>No Evaluations</p>
                    ) : null}
                  </div>
                  {/* {JSON.stringify(details)} */}
                  {details.data.row.stage === index ? (
                    <div className="flex justify-end items-center gap-4 mt-4">
                      {details.data.row.stage ===
                      competition.stages.length - 1 ? (
                        <span
                          className="px-4 py-2 border  rounded bg-green-700 text-white hover:scale-[102%] transition ease-in-out cursor-pointer text-sm"
                          onClick={moveToNextStage}
                        >
                          Move them to finalists
                        </span>
                      ) : (
                        <span
                          className="px-4 py-2 border  rounded bg-actionbtnBlue text-white hover:scale-[102%] transition ease-in-out cursor-pointer text-sm"
                          onClick={moveToNextStage}
                        >
                          Accepted for Next Round
                        </span>
                      )}
                      <span className="text-sm bg-red-700 px-4 py-2 text-white hover:scale-[102%] transition ease-in-out cursor-pointer rounded">
                        Reject
                      </span>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

const Info2 = ({ question, stageResponse }) => {
  if (!stageResponse) {
    return <></>;
  }
  if (
    question.answerOptions.type === "singleChoice" ||
    question.answerOptions.type === "multipleChoice"
  ) {
    return (
      <div className="pyw-3 flex flex-col gap-1" key={question.question_id}>
        <p className="text-sm font-semibold capitalize">{question.question}</p>
        <div className="flex flex-row items-center gap-3">
          <p>Options</p>
          {question.answerOptions.options.values.map((option) => (
            <div className="px-4 py-1 border rounded">{option}</div>
          ))}
        </div>
        <div className="text-sm  p-2 rounded-md min-h-10 border shadow">
          {JSON.stringify(stageResponse[question.question_id])}
        </div>
      </div>
    );
  }
  if (question.answerOptions.type === "file") {
    return (
      <div className="pyw-3 flex flex-col gap-1" key={question.question_id}>
        <p className="text-sm font-semibold capitalize">{question.question}</p>
        <a
          target="_blank"
          href={stageResponse[question.question_id]}
          className="border p-2 w-fit rounded flex flex-row gap-2 items-center text-sm"
        >
          <FolderOpenOutlinedIcon />
          View Submission
        </a>
      </div>
    );
  }
  if (question.answerOptions.type === "table") {
    return (
      <div className="pyw-3 flex flex-col gap-1" key={question.question_id}>
        <p className="text-sm font-semibold capitalize">{question.question}</p>
        {/* <div className="flex flex-row rounded overflow-hidden gap-1 ">
            {
          </div> */}
        <table>
          <thead>
            <tr>
              {question.answerOptions.options.rowHeaders.map((row) => (
                <td className="border p-2 px-4 font-semibold">{row}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {stageResponse[question.question_id][0].values.map((item) => (
                <td className="border p-2 px-4">{item}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="pyw-3 flex flex-col gap-1" key={question.question_id}>
      <p className="text-sm font-semibold capitalize">{question.question}</p>
      <div className="text-sm capitalize p-3 rounded-md h-20 border shadow">
        {stageResponse ? stageResponse[question.question_id] : null}
      </div>
    </div>
  );
};
