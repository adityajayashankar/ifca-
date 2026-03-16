import {
  dismissToast,
  errorToast,
  loadingToast,
  successToast,
} from "@helpers/toastconfig";
import useStateStore from "@zustand/index";
import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { verifyCompetitionInput } from "./micro/helpers";
import { uploadFile } from "@helpers/file-upload";
import { sectors } from "@helpers/constants";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import "react-quill/dist/quill.snow.css";
import Head from "next/head";
import CheckBox from "@mui/icons-material/CheckBox";
import Switch from "@mui/material/Switch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BreadCrumps from "@components/Common/BreadCrumps";
export default function EditCompetition({
  stages,
  setStages,
  competitionDetails,
  setCompetitionDetails,
}) {
  const fileref = useRef(null);
  const [error, seterror] = useState(null);
  const Answertypes = [
    {
      label: "Text",
      value: "text",
      options: {
        maxChar: "",
      },
    },
    { label: "Number", value: "number", options: { max: "", min: "" } },
    {
      label: "Single Choice",
      value: "singleChoice",
      options: { values: [] },
    },
    {
      label: "Multiple Choice",
      value: "multipleChoice",
      options: { values: [] },
    },
    { label: "File", value: "file", options: { maxSize: 10 } },
    // { label: "Table", value: "table", options: { rowHeaders: [] } },
  ];
  const AnswerTypeOptions = Answertypes.map((item) => {
    return { label: item.label, value: item.value };
  });
  const [sectorsOptions, setsectorsOptions] = useState([]);
  const addStageHandler = () => {
    setStages([
      ...stages,
      {
        stage_id: uuidv4(),
        fields: [],
        evaluators: [],
        evaluatorQuestion: [],
      },
    ]);
  };
  const [evaluators, setevaluators] = useState([]);
  const [quill, setquill] = useState(null);
  useEffect(() => {
    if (!quill && competitionDetails.description) {
      const quilled = new Quill("#editor", {
        theme: "snow",
        toolbar: false,
      });
      quilled.setContents(competitionDetails.description);
      quilled.on("text-change", function (delta, oldDelta, source) {
        setCompetitionDetails((competitionDetails) => {
          return {
            ...competitionDetails,
            description: quilled.getContents().ops,
          };
        });
      });
      setquill(quilled);
    }
  }, [competitionDetails]);

  const services = useStateStore((state) => state.services);
  useEffect(() => {
    services.evaluator &&
      services.evaluator.find().then((res) => {
        if (res.status) {
          const evaluators = res.successObject.map((evaluator) => {
            return {
              label: evaluator.name,
              value: evaluator.evaluator_id,
            };
          });
          setevaluators(evaluators);
          setsectorsOptions(
            sectors.map((item) => ({ label: item, value: item })),
          );
        } else {
          errorToast("Failed to fetch evaluators");
        }
      });
  }, [services]);

  const AddquestionHandler = (stageIndex) => {
    const tempstages = [...stages];
    tempstages[stageIndex].fields.push({
      question_id: uuidv4(),
      question: "",
      answerOptions: {},
    });
    setStages(tempstages);
  };

  const DeleteStageHandler = (stageindex, questionIndex) => {
    const tempstages = [...stages];
    tempstages[stageindex].fields.splice(questionIndex, 1);
    setStages(tempstages);
  };

  const addEvaluatorQuestionHandler = (stageindex) => {
    const question = prompt("Enter Question");
    if (!question) return;

    const tempstages = [...stages];

    tempstages[stageindex].evaluatorQuestion.push({
      question_id: uuidv4(),
      question: question,
      answerOptions: {},
    });
    setStages(tempstages);
  };
  const DeleteEvaulatorQuestion = (stageindex, questionIndex) => {
    const tempstages = [...stages];
    tempstages[stageindex].evaluatorQuestion.splice(questionIndex, 1);
    setStages(tempstages);
  };

  const EditCompetitionHandler = async (e) => {
    e.preventDefault();
    seterror(null);
    const [success, err] = verifyCompetitionInput(competitionDetails, stages);
    if (err) {
      seterror(err);
      return;
    }
    const body = {
      ...competitionDetails,
      stages: stages,
    };
    console.log(body);
    if (body.bannerUrl) delete body.bannerUrl;
    if (typeof body.banner !== "string") {
      try {
        const tid = loadingToast("Uploading banner image");
        const bannerImage = await uploadFile(body.banner, "competition/");
        dismissToast(tid);
        if (bannerImage) {
          body.banner = bannerImage;
          successToast("Banner Image Upload done");
        } else {
          body.banner = "";
          errorToast("Failed to upload Image");
        }
      } catch (err) {
        seterror(err.message);
      }
    }

    const comp = loadingToast("Starting a new competition");

    body.description = quill.getContents().ops;

    services.competition
      .IncubatorEditCompetition(body.competition_id, body)
      .then((res) => {
        console.log(res);
        if (res.status) {
          successToast("Competition edited successfully");
        } else {
          errorToast("Failed to edit Competition");
        }
        dismissToast(comp);
      });
  };
  const crumbs = [
    {
      name: "Dashboard",
      link: "/myIncubator",
    },
    {
      name: "Competitions",
      link: "/myIncubator/competitions/",
    },
    {
      name: "Edit",
      link: "/#",
    },
  ];
  return (
    <div className="cust_sm:px-4 rounded ">
      <Head>
        <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
      </Head>
      <BreadCrumps crumbs={crumbs} />
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 pb-2">
        <div>
          <p className="text-3xl font-semibold">Edit Competition</p>
          <p className="text-sm text-gray-600">View and manage competitions</p>
        </div>
      </div>
      <form className="flex flex-col gap-3  pt-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col justify-around ">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="block text-sm font-semibold">
                Title
              </label>
              <div className="">
                <input
                  type="text"
                  name="title"
                  id="title"
                  defaultValue={competitionDetails.title}
                  onChange={(e) => {
                    setCompetitionDetails({
                      ...competitionDetails,
                      [e.target.name]: e.target.value,
                    });
                  }}
                  className="w-full rounded border border-gray-300 p-1 px-2 text-sm placeholder:text-sm"
                  placeholder="Enter title"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="title" className="block text-sm font-semibold">
                Domains
              </label>
              <div className="">
                {competitionDetails.domains && (
                  <Select
                    options={sectorsOptions}
                    isMulti
                    defaultValue={competitionDetails.domains}
                    onChange={(e) => {
                      setCompetitionDetails({
                        ...competitionDetails,
                        domains: e,
                      });
                    }}
                  />
                )}
              </div>
            </div>
            <div className="text-headingColor my-2 flex flex-col">
              <label className="text-sm font-semibold ">
                Accept applications status
              </label>
              <div className="flex flex-row items-center gap-3 text-sm font-semibold">
                <span className="text-red-600">Stop Accepting</span>
                <Switch
                  checked={competitionDetails.accept_applications}
                  onChange={(e) => {
                    setCompetitionDetails({
                      ...competitionDetails,
                      accept_applications: e.target.checked,
                    });
                  }}
                />
                <span> Accept Applications</span>
              </div>
            </div>
            <div className="">
              <label htmlFor="title" className="block text-sm font-semibold">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="startDate"
                min={new Date().toISOString().split(".")[0]}
                id="title"
                defaultValue={competitionDetails.startDate}
                onChange={(e) => {
                  setCompetitionDetails({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  });
                }}
                className="w-full rounded border border-gray-300 p-1 px-2"
                placeholder="Enter title"
              />
            </div>
            <div className="">
              <label htmlFor="title" className="block text-sm font-semibold">
                End Date
              </label>
              <input
                type="datetime-local"
                name="endDate"
                id="title"
                defaultValue={competitionDetails.endDate}
                min={competitionDetails.startDate}
                onChange={(e) => {
                  setCompetitionDetails({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  });
                }}
                className="w-full rounded border border-gray-300 p-1 px-2"
                placeholder="Enter title"
              />
            </div>
            <div className="">
              <label htmlFor="title" className="block text-sm font-semibold">
                Stop accepting applications on
              </label>
              <input
                type="datetime-local"
                name="application_ends_on"
                id="title"
                max={competitionDetails.startDate}
                defaultValue={competitionDetails.application_ends_on}
                onChange={(e) => {
                  setCompetitionDetails({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  });
                }}
                className="w-full rounded border border-gray-300 p-1 px-2"
                placeholder="Enter title"
              />
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-1">
              {/* {JSON.stringify(competitionDetails.description)} */}

              <label htmlFor="title" className="block text-sm font-semibold">
                Description
              </label>
              <div className="">
                <div id="editor"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="block text-sm font-semibold">
            Banner Image
          </label>
          {competitionDetails.banner ? (
            <div className="flex flex-row items-end gap-2">
              <img
                src={
                  competitionDetails.banner.length
                    ? competitionDetails.banner
                    : competitionDetails.bannerUrl
                }
                alt=""
                className="h-44 w-auto rounded border border-gray-300 object-contain shadow"
              />
              <span
                onClick={() => {
                  setCompetitionDetails({
                    ...competitionDetails,
                    banner: null,
                  });
                }}
                className="border-actionbtnBlue text-actionbtnBlue hover:bg-actionbtnBlue rounded border px-4 py-2 text-sm font-semibold transition ease-in-out hover:scale-105 hover:text-white"
              >
                Clear
              </span>
            </div>
          ) : (
            <div className="py-2">
              <input
                type="file"
                name="banner"
                id="title"
                accept="image/*"
                className="w-full rounded border border-gray-300 p-1 px-2"
                placeholder="Enter title"
                onChange={(e) => {
                  console.log(URL.createObjectURL(e.target.files[0]));
                  setCompetitionDetails({
                    ...competitionDetails,
                    [e.target.name]: e.target.files[0],
                    bannerUrl: URL.createObjectURL(e.target.files[0]),
                  });
                }}
                ref={fileref}
                hidden
              />

              <span
                className="cursor-pointer rounded border border-[#10B981] px-4 py-2 text-sm font-semibold text-green-500 hover:drop-shadow"
                onClick={() => {
                  fileref.current.click();
                }}
              >
                Choose File
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center justify-between border-b-2 pb-2">
            <p className="text-lg font-semibold  text-gray-700">Stages</p>
          </div>
          {stages.length === 0 ? (
            <p className="text-center text-sm font-semibold text-gray-700 ">
              Add stages to get started
            </p>
          ) : (
            <></>
          )}
          {/* {JSON.stringify(evaluators)} */}
          {stages.map((stage, index) => {
            return (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <div className="flex w-[90%] flex-row items-center justify-between">
                    <p className="text-lg">Stage - {index + 1}</p>
                  </div>
                </AccordionSummary>
                <AccordionDetails className="grid grid-cols-2 gap-5">
                  <div className="rounded border p-4 shadow shadow">
                    <p className=" pb-2 font-semibold text-gray-700">
                      Select Evaluators
                    </p>
                    <Select
                      options={evaluators}
                      isMulti
                      defaultValue={stage.evaluators}
                      onChange={(e) => {
                        console.log(e);
                        let tempstages = [...stages];
                        tempstages[index].evaluators = e;
                        setStages(tempstages);
                      }}
                    />
                    <div className="my-2 flex flex-col gap-5">
                      <div className="flex flex-row items-center justify-between">
                        <p className="font-semibold text-gray-700">
                          {" "}
                          Questions
                        </p>
                      </div>
                      {stage.fields.length === 0 ? (
                        <div className="-my-2">
                          <p className="text-sm text-gray-500">
                            No Questions added
                          </p>
                        </div>
                      ) : (
                        <></>
                      )}
                      {stage.fields.map((field, fieldIndex) => {
                        return (
                          <div className="flex flex-col gap-2 rounded border p-4">
                            <div>
                              <div className="flex flex-row items-center justify-between">
                                <p className="text-sm font-semibold">
                                  {fieldIndex + 1}. Question
                                </p>
                                <span
                                  className="text-sm font-semibold text-red-700"
                                  onClick={() => {
                                    DeleteStageHandler(index, fieldIndex);
                                  }}
                                >
                                  <DeleteOutlineOutlinedIcon />
                                </span>
                              </div>
                              <input
                                className="mt-1 w-full rounded border p-2 text-sm"
                                placeholder="Type your question here"
                                value={field.question}
                                onChange={(e) => {
                                  let tempstages = [...stages];
                                  tempstages[index].fields[
                                    fieldIndex
                                  ].question = e.target.value;
                                  setStages(tempstages);
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <p className="mt-1 text-sm">Answer</p>
                              <Select
                                className="text-sm"
                                options={AnswerTypeOptions}
                                defaultValue={
                                  AnswerTypeOptions.filter(
                                    (item) =>
                                      item.value === field.answerOptions.type,
                                  )[0]
                                }
                                onChange={(e) => {
                                  console.log(e);
                                  const answerOption = Answertypes.find(
                                    (item) => item.value === e.value,
                                  );
                                  let tempstages = [...stages];
                                  tempstages[index].fields[
                                    fieldIndex
                                  ].answerOptions = {
                                    type: e.value,
                                    options: answerOption.options,
                                  };
                                  setStages(tempstages);
                                }}
                              />
                              {field.answerOptions.type === "singleChoice" ||
                              field.answerOptions.type === "multipleChoice" ? (
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm">Answer Options</p>
                                  {field.answerOptions.options.values.map(
                                    (item, valueindex) => {
                                      return (
                                        <div className="flex w-full flex-row items-center gap-2">
                                          <span className=" w-1/2  rounded  border-2 border-gray-400 px-4 py-2 text-xs capitalize text-black ">
                                            {valueindex + 1}&nbsp;. &nbsp;{item}
                                          </span>
                                          <span
                                            className="text-xs font-semibold text-red-600"
                                            onClick={() => {
                                              let tempstages = [...stages];
                                              tempstages[index].fields[
                                                fieldIndex
                                              ].answerOptions.options.values.splice(
                                                valueindex,
                                                1,
                                              );
                                              setStages(tempstages);
                                            }}
                                          >
                                            <DeleteOutlineOutlinedIcon />
                                          </span>
                                        </div>
                                      );
                                    },
                                  )}
                                  <span
                                    className="bg-headingColor mt-4 w-fit rounded px-4 py-2 text-sm text-white"
                                    onClick={() => {
                                      const values = prompt(
                                        "Enter Value for option",
                                      );
                                      if (!values) return;
                                      let tempstages = [...stages];
                                      tempstages[index].fields[
                                        fieldIndex
                                      ].answerOptions.options.values.push(
                                        values,
                                      );
                                      setStages(tempstages);
                                    }}
                                  >
                                    Add Option
                                  </span>
                                </div>
                              ) : (
                                <></>
                              )}
                              {field.answerOptions.type === "table" ? (
                                <div className="flex flex-col gap-1 text-sm">
                                  <p className="text-headingColor mb-2 border-b-2 text-sm font-semibold">
                                    Options
                                  </p>
                                  <p>Column headers</p>
                                  <div className="scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-rounded scrollbar-thumb-gray-400 flex flex-row overflow-x-scroll ">
                                    {field.answerOptions.options.rowHeaders.map(
                                      (item, valueindex) => {
                                        return (
                                          <div className="flex flex-row items-center gap-5 border px-4 ">
                                            <span className=" w-fit  whitespace-nowrap rounded p-4  text-xs capitalize ">
                                              {valueindex + 1}&nbsp;. &nbsp;
                                              {item}
                                            </span>
                                            <span
                                              className="text-xs font-semibold text-red-600"
                                              onClick={() => {
                                                let tempstages = [...stages];
                                                tempstages[index].fields[
                                                  fieldIndex
                                                ].answerOptions.options.rowHeaders.splice(
                                                  valueindex,
                                                  1,
                                                );
                                                setStages(tempstages);
                                              }}
                                            >
                                              <DeleteOutlineOutlinedIcon />
                                            </span>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                  <span
                                    onClick={() => {
                                      const header = prompt(
                                        "Enter column Header",
                                      );
                                      console.log(header);
                                      if (!header) return;
                                      let tempstages = [...stages];
                                      tempstages[index].fields[
                                        fieldIndex
                                      ].answerOptions.options.rowHeaders.push(
                                        header,
                                      );
                                      setStages(tempstages);
                                    }}
                                    className="bg-actionbtnBlue w-fit rounded px-4 py-2 text-white"
                                  >
                                    Add column Header
                                  </span>
                                </div>
                              ) : (
                                <></>
                              )}
                              {field.answerOptions.type === "file" ? (
                                <div className="text-sm">
                                  <p className="text-headingColor mb-2  border-b-2 text-sm font-semibold">
                                    Options
                                  </p>
                                  <p>
                                    Max size (in MB)
                                    <span className="text-gray-400">
                                      (optional)
                                    </span>
                                  </p>
                                  <input
                                    className="w-full rounded border  p-2"
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={
                                      field.answerOptions.options.maxSize
                                    }
                                    onInput={(e) => {
                                      e.target.value = e.target.value.replace(
                                        /[^0-9]/g,
                                        "",
                                      );
                                    }}
                                    onChange={(e) => {
                                      let tempstages = [...stages];
                                      tempstages[index].fields[
                                        fieldIndex
                                      ].answerOptions.options.maxSize = Number(
                                        e.target.value,
                                      );
                                      setStages(tempstages);
                                    }}
                                  />
                                </div>
                              ) : (
                                <></>
                              )}
                              {field.answerOptions.type === "text" ? (
                                <div className="flex flex-col gap-2">
                                  <p className="text-headingColor border-b-2 text-sm font-semibold">
                                    Options
                                  </p>
                                  <p className="text-sm">
                                    Maximum characters{" "}
                                    <span className="text-gray-500">
                                      (Optional)
                                    </span>
                                  </p>
                                  <input
                                    className="w-full rounded border  p-2"
                                    type="number"
                                    min={0}
                                    defaultValue={
                                      field.answerOptions.options.maxChar
                                    }
                                    onInput={(e) => {
                                      e.target.value = e.target.value.replace(
                                        /[^0-9]/g,
                                        "",
                                      );
                                    }}
                                    onChange={(e) => {
                                      let tempstages = [...stages];
                                      tempstages[index].fields[
                                        fieldIndex
                                      ].answerOptions.options.maxChar = Number(
                                        e.target.value,
                                      );
                                      setStages(tempstages);
                                    }}
                                  />
                                </div>
                              ) : (
                                <></>
                              )}
                              {field.answerOptions.type === "number" ? (
                                <div>
                                  <p className="text-headingColor mb-2 border-b-2 text-sm font-semibold">
                                    Options
                                  </p>
                                  <div>
                                    <p>
                                      <span className="text-sm">Minimum</span>
                                      <span className="text-xs text-gray-500">
                                        (optional)
                                      </span>
                                    </p>
                                    <input
                                      className="w-full rounded border  p-2"
                                      type="number"
                                      min={0}
                                      defaultValue={
                                        field.answerOptions.options.min
                                      }
                                      onInput={(e) => {
                                        e.target.value = e.target.value.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                      }}
                                      onChange={(e) => {
                                        let tempstages = [...stages];
                                        tempstages[index].fields[
                                          fieldIndex
                                        ].answerOptions.options.min = Number(
                                          e.target.value,
                                        );
                                        setStages(tempstages);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p>
                                      <span className="text-sm">Maximum</span>
                                      <span className="text-xs text-gray-500">
                                        (optional)
                                      </span>
                                    </p>
                                    <input
                                      className="w-full rounded border  p-2"
                                      type="number"
                                      min={0}
                                      defaultValue={
                                        field.answerOptions.options.max
                                      }
                                      onInput={(e) => {
                                        e.target.value = e.target.value.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                      }}
                                      onChange={(e) => {
                                        let tempstages = [...stages];
                                        tempstages[index].fields[
                                          fieldIndex
                                        ].answerOptions.options.max = Number(
                                          e.target.value,
                                        );
                                        setStages(tempstages);
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-end">
                        <span
                          className="bg-actionbtnBlue w-fit rounded px-4 py-2 text-xs text-white "
                          onClick={() => {
                            AddquestionHandler(index);
                          }}
                        >
                          Add Question
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grow border p-4 shadow ">
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-md text-headingColor font-semibold">
                        Evaluator Questions
                      </p>
                      <span
                        onClick={() => {
                          addEvaluatorQuestionHandler(index);
                        }}
                        className="bg-actionbtnBlue rounded px-4 py-2 text-xs text-white"
                      >
                        Add Question
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div>
                      {stage.evaluatorQuestion.length === 0 ? (
                        <div>
                          <p className="text-sm text-gray-500">
                            No Questions added
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {stage.evaluatorQuestion.map(
                            (item, questionIndex) => {
                              return (
                                <div
                                  className=" flex flex-row items-center justify-between gap-3 border-b-2 pb-1"
                                  key={item.question_id}
                                >
                                  <input
                                    className=" w-full rounded border  p-2 text-sm capitalize"
                                    contentEditable
                                    placeholder="Enter Question"
                                    defaultValue={item.question}
                                    onChange={(e) => {
                                      let tempstages = [...stages];
                                      tempstages[index].evaluatorQuestion[
                                        questionIndex
                                      ].question = e.target.value;
                                      setStages(tempstages);
                                    }}
                                  />
                                  <div className="text-headingColor flex flex-row gap-3">
                                    {/* <EditOutlinedIcon /> */}
                                    <DeleteOutlineOutlinedIcon
                                      className="text-red-700"
                                      onClick={() => {
                                        DeleteEvaulatorQuestion(
                                          index,
                                          questionIndex,
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
        <div className="flex flex-row items-center justify-end gap-5 text-sm">
          <span
            onClick={addStageHandler}
            className="bg-actionbtnBlue w-fit rounded px-4 py-2 text-sm text-white"
          >
            Add Stage
          </span>
          <button
            className="bg-headingColor rounded px-4 py-2 text-sm text-white"
            onClick={EditCompetitionHandler}
          >
            Edit Competition
          </button>
          {error ? (
            <p className="font-semibold text-red-600">Error: {error}</p>
          ) : (
            <></>
          )}
          {/* {JSON.stringify(stages)} */}
        </div>
      </form>
    </div>
  );
}
