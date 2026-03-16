import {
  dismissToast,
  errorToast,
  loadingToast,
  successToast,
} from "@helpers/toastconfig";
import useStateStore from "@zustand/index";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { v4 as uuidv4 } from "uuid";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { verifyCompetitionInput } from "./micro/helpers";
import { uploadFile } from "@helpers/file-upload";
import { sectors } from "@helpers/constants";
import Head from "next/head";
import "react-quill/dist/quill.snow.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/router";
import BreadCrumps from "@components/Common/BreadCrumps";
import dynamic from "next/dynamic";

// lazy load reactquill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import "react-quill/dist/quill.snow.css";
function CreateCompetition() {
  const router = useRouter();
  const [stages, setStages] = useState([]);
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
    { label: "Table", value: "table", options: { rowHeaders: [] } },
  ];
  const [competitionDetails, setCompetitionDetails] = useState({});
  const [imageBlob, setimageBlob] = useState(null);
  const fileref = React.useRef(null);
  const AnswerTypeOptions = Answertypes.map((item) => {
    return { label: item.label, value: item.value };
  });
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

  const CreateCompetitionHandler = async (e) => {
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
    const comp = loadingToast("Starting a new competition");

    services.competition.createAsIncubator(body).then((res) => {
      if (res.status) {
        successToast("Competition created successfully");
        return router.back();
      } else {
        errorToast("Failed to create Competition");
      }
      dismissToast(comp);
    });

    // services
  };
  const [description, setdescription] = useState([]);
  // useEffect(() => {
  //   const quilled = new Quill("#editor", {
  //     theme: "snow",
  //     toolbar: false,
  //   });
  //   quilled.on("text-change", function (delta, oldDelta, source) {
  //     console.log(quilled.getContents().ops);
  //     setCompetitionDetails((competitionDetails) => {
  //       return {
  //         ...competitionDetails,
  //         description: quilled.getContents().ops,
  //       };
  //     });
  //     setdescription(quilled.getContents().ops);
  //   });
  // }, []);
  useEffect(() => {
    console.log(competitionDetails.description, "competitionDetails");
  }, [competitionDetails]);
  const crumps = [
    {
      name: "Dashboard",
      link: "/myIncubator/",
    },
    {
      name: "Competitions",
      link: "/myIncubator/competitions",
    },
    {
      name: "Create",
      link: "/myIncubator/competitions/new",
    },
  ];
  return (
    <div className="rounded ">
      <Head>
        <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
      </Head>

      <BreadCrumps crumbs={crumps} />
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 pb-2">
        {JSON.stringify(competitionDetails.description)}
        {JSON.stringify(description)}
        <div>
          <p className="text-3xl font-semibold">Create Competition</p>
        </div>
        <div className="flex flex-row flex-wrap gap-3"></div>
      </div>
      <form className="flex flex-col gap-3 pt-4">
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="block text-sm font-semibold">
                Title
              </label>
              <div className="">
                <input
                  type="text"
                  name="title"
                  id="title"
                  onChange={(e) => {
                    setCompetitionDetails((competitionDetails) => ({
                      ...competitionDetails,
                      [e.target.name]: e.target.value,
                    }));
                  }}
                  className="w-full rounded border border-gray-300 p-1 px-2 placeholder:text-sm"
                  placeholder="Enter title"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="title" className="block text-sm font-semibold">
                Domains
              </label>
              <div className="">
                <Select
                  isMulti={true}
                  name="domains"
                  options={sectors.map((item) => ({
                    label: item,
                    value: item,
                  }))}
                  onChange={(e) => {
                    setCompetitionDetails((competitionDetails) => ({
                      ...competitionDetails,
                      domains: e,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="grow">
              <label htmlFor="title" className="block text-sm font-semibold">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="startDate"
                min={new Date().toISOString().split(".")[0]}
                id="title"
                onChange={(e) => {
                  setCompetitionDetails((competitionDetails) => ({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  }));
                }}
                className="w-full rounded border border-gray-300 p-1 px-2 text-sm"
                placeholder="Enter title"
              />
            </div>
            <div className="grow">
              <label htmlFor="title" className="block text-sm font-semibold">
                End Date
              </label>
              <input
                type="datetime-local"
                name="endDate"
                id="title"
                min={competitionDetails.startDate}
                onChange={(e) => {
                  setCompetitionDetails((competitionDetails) => ({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  }));
                }}
                className="w-full rounded border border-gray-300 p-1 px-2 text-sm"
                placeholder="Enter title"
              />
            </div>
            <div className="grow">
              <label htmlFor="title" className="block text-sm font-semibold">
                Application ends on
              </label>
              <input
                type="datetime-local"
                name="application_ends_on"
                id="title"
                max={competitionDetails.startDate}
                onChange={(e) => {
                  setCompetitionDetails((competitionDetails) => ({
                    ...competitionDetails,
                    [e.target.name]: e.target.value,
                  }));
                }}
                className="w-full rounded border border-gray-300 p-1 px-2"
                placeholder="Enter title"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="block text-sm font-semibold">
              Descriprtion
            </label>
            <div className="scrollbar-thin scrollbar-track-slate-300 scrollbar-thumb-slate-500 h-80 w-full overflow-y-scroll border-b-2">
              {/* <div id="editor"></div> */}
              <ReactQuill
                theme="snow"
                onChange={(value, delta, source, editor) => {
                  console.log(value, delta.ops, editor.getContents().ops);
                  setCompetitionDetails((competitionDetails) => ({
                    ...competitionDetails,
                    description: editor.getContents().ops,
                  }));
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label htmlFor="title" className="block text-sm font-semibold">
            Banner Image
          </label>
          <div className="flex flex-row gap-4">
            <input
              type="file"
              name="banner"
              id="title"
              accept="image/*"
              className="w-full rounded border border-gray-300 p-1 px-2"
              placeholder="Enter title"
              onChange={(e) => {
                console.log(e.target.files[0]);
                if (e.target.files.length === 0) return;
                setCompetitionDetails((competitionDetails) => ({
                  ...competitionDetails,
                  [e.target.name]: e.target.files[0],
                }));
                setimageBlob(URL.createObjectURL(e.target.files[0]));
              }}
              hidden
              ref={fileref}
            />
            <div>
              {imageBlob ? (
                <div>
                  <img
                    src={imageBlob}
                    className="h-40 w-full  object-cover object-center"
                  />
                </div>
              ) : (
                <div
                  htmlFor="banner"
                  className="flex h-28 w-32 cursor-pointer items-center justify-center rounded border border-gray-300 p-1 px-2 text-sm"
                >
                  No Preview
                </div>
              )}
            </div>
            <div className="flex  w-full flex-col gap-2 rounded p-3">
              <div className="border shadow">
                <div className="flex flex-row items-center gap-4 p-2">
                  <div
                    onClick={() => {
                      fileref.current.click();
                    }}
                    className="rounded border border-[#10B981] px-3 py-2 text-sm font-semibold text-[#10B981]"
                  >
                    Choose File
                  </div>
                  <p className="text-sm">
                    {competitionDetails?.banner?.name || "No file selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col ">
          <div className="mb-2 flex flex-row items-center justify-between border-b-2 pb-2">
            <p className="text-lg font-semibold  text-gray-700">Stages</p>
          </div>
          {stages.length === 0 ? (
            <p className="text-center text-sm font-semibold text-gray-700 ">
              Add stages to get started
            </p>
          ) : (
            <></>
          )}
          {/* {JSON.stringify(competitionDetails)} */}
          {stages.map((stage, index) => {
            return (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <div className="flex w-[90%] flex-row items-center justify-between">
                    <p className="text-headingColor w-full text-lg font-semibold antialiased">
                      Stage {index + 1}
                    </p>
                    <span
                      className="text-sm font-semibold text-red-400"
                      onClick={() => {
                        let tempstages = [...stages];
                        tempstages.splice(index, 1);
                        setStages(tempstages);
                      }}
                    >
                      Delete
                    </span>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <div
                    className="flex flex-row justify-between  gap-3 "
                    key={stage.stage_id}
                  >
                    <div className="flex w-1/2 grow flex-col gap-2 rounded-md border p-4 shadow">
                      <p className=" font-semibold text-gray-700">
                        Select Evaluators
                      </p>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={handleEmailChange}
                        onKeyDown={handleEmailAdd} // Add email on pressing Enter
                        onBlur={handleBlur} // Add email when input loses focus
                        placeholder="Enter evaluator email"
                        className="border px-3 py-1 rounded"
                      />
                      <hr className="mt-4" />
                      <div className="my-2 flex flex-col gap-5">
                        <div className="flex flex-row items-center justify-between">
                          <p className="font-semibold  text-gray-700">
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
                            <div
                              className="flex flex-col gap-2 rounded border p-4"
                              key={field.question_id}
                            >
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
                                    <DeleteOutlineOutlinedIcon className="cursor-pointer" />
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
                                field.answerOptions.type ===
                                  "multipleChoice" ? (
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm">Answer Options</p>
                                    {field.answerOptions.options.values.map(
                                      (item, valueindex) => {
                                        return (
                                          <div className="flex w-full flex-row items-center gap-2">
                                            <span className=" w-1/2  rounded  border-2 border-gray-400 px-4 py-2 text-xs capitalize text-black ">
                                              {valueindex + 1}&nbsp;. &nbsp;
                                              {item}
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
                                        ].answerOptions.options.maxSize =
                                          Number(e.target.value);
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
                                        ].answerOptions.options.maxChar =
                                          Number(e.target.value);
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
                                        onInput={(e) => {
                                          e.target.value =
                                            e.target.value.replace(
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
                                        onInput={(e) => {
                                          e.target.value =
                                            e.target.value.replace(
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
                                  </div>
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                    <div className="w-1/2 grow rounded-md border p-4 shadow">
                      <div className="flex flex-row items-center justify-between">
                        <p className=" text-headingColor font-semibold">
                          Evaluator Questions
                        </p>
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
                                    <p className="text-sm capitalize">
                                      {questionIndex + 1} . {item.question}
                                    </p>
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
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end py-4">
                        <span
                          onClick={() => {
                            addEvaluatorQuestionHandler(index);
                          }}
                          className="bg-actionbtnBlue rounded px-4 py-2 text-xs text-white"
                        >
                          Add Question
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
        <div className="flex flex-row items-center justify-end gap-5">
          <span
            onClick={addStageHandler}
            className="bg-actionbtnBlue w-fit rounded px-4 py-2 text-sm text-white"
          >
            Add Stage
          </span>
          <button
            className="bg-headingColor rounded px-4 py-2 text-sm text-white"
            onClick={CreateCompetitionHandler}
          >
            Create Competition
          </button>
          {error ? (
            <p className="font-semibold text-red-600">Error: {error}</p>
          ) : (
            <></>
          )}
        </div>
        {/* {JSON.stringify(stages)} */}
      </form>
    </div>
  );
}

export default CreateCompetition;
