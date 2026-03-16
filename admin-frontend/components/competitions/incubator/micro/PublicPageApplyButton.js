import Modal from "@mui/material/Modal";
import { useEffect, useState } from "react";

function PublicPageApplyButton({
  application_ends_on,
  accept_application,
  competition_id,
  competion,
  user,
}) {
  let accept = false;
  if (accept_application) {
    const today = new Date();
    const end = new Date(application_ends_on);
    accept = today <= end;
  }
  const [disabled, setdisablesd] = useState(null);
  const [allowed, setallowed] = useState(false);
  if (accept) {
    return (
      <Applybutton
        user={user}
        competion={competion}
        competition_id={competition_id}
        disabled={disabled}
        allowed={true}
      />
    );
  }
  return <ApplicationsClosed />;
}

export default PublicPageApplyButton;

const ApplicationsClosed = () => {
  return (
    <div
      className={`py-2 w-full bg-gray-300 text-white font-semibold text-center rounded shadow hover:shadow-lg hover:scale-[102%] transition ease-in-out hover:cursor-pointer`}
    >
      Application Closed
    </div>
  );
};

const Applybutton = ({
  user,
  competition_id,
  competion,
  disabled,
  allowed,
}) => {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);
  const redirect = `/competitions/${competition_id}`;
  const [creds, setCreds] = useState({});
  const [authStage, setAuthStage] = useState(0);
  const [error, setError] = useState(null);
  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    const formValues = Object.fromEntries(new FormData(e.target).entries());
    if (formValues.email.length < 1) {
      setError("Email cannot be empty");
      return;
    }
    if (formValues.password.length < 1) {
      setError("Password cannot be empty");
      return;
    }
    if (formValues.cpassword.length < 1) {
      setError("Confirm Password cannot be empty");
      return;
    }
    if (formValues.password !== formValues.cpassword) {
      setError("Passwords don't match");
      return;
    }

    const resp = await new Applicant().sendOtp({ email: formValues.email });

    setCreds(formValues);
    setError(null);
    setAuthStage(1);
  };

  const verifyHandler = async (e) => {
    const docs = document.getElementsByClassName("otpInput");
    let otp = "";
    for (let i = 0; i < docs.length; i++) {
      otp += docs[i].value;
    }

    if (otp.length < 6) {
      errorToast("Please enter a valid OTP");
      return;
    }
    const resp = await new Applicant().verifyOtpAndOnboard({
      email: creds.email,
      password: creds.password,
      otp,
    });

    if (resp.status) {
      successToast("Account Created");
      try {
        const response = await signInWithEmailAndPassword(
          auth,
          creds.email,
          creds.password
        );

        const tokenId = await getIdToken(response.user);
        const user = {
          user_id: response.user.uid,
          name: response.user.displayName,
          email: response.user.email,
        };
        if (response.user.emailVerified) {
          NEXTJS_API_POST("/auth/user", {}, { user: response.user, tokenId })
            .then((res) => {
              if (res.data.isError) {
                errorToast("Login Failed");
                window.location.href = "https://6inc.co/login";
                return;
              }
              logger({
                type: "Login with username and password",
                page: "Login",
                user_id: user.user_id,
              });
              localStorage.removeItem("nluid");
              if (!redirect) {
                window.location.href = res.data.redirectLink;
              } else {
                window.location.replace(redirect);
              }
            })
            .catch((err) => {
              errorToast("Session Error");
            });
        } else {
          infoToast(
            "Seems like Your account isn't verified, Please check your email and come back later"
          );
        }
      } catch (e) {
        errorToast(FIREBASE_ERROR_MAP[e.code]);
      }
    } else {
      errorToast(resp.errorMessage);
    }
  };

  const submitApplication =()=>{
    console.log('submit hre----')
  }

  const [answers, setanswers] = useState({});
  if (!allowed) {
    return <></>;
  }
  if (disabled) {
    return (
      <div
        className={`py-2 w-full bg-gray-300 text-white font-semibold text-center rounded shadow hover:shadow-lg hover:scale-[102%] transition ease-in-out hover:cursor-pointer`}
      >
        Application Submitted
      </div>
    );
  }
  return (
    
    <>
    
      <div
        className={`py-2 w-full bg-[#4094F7] text-white font-semibold text-center rounded shadow hover:shadow-lg hover:scale-[102%] transition ease-in-out hover:cursor-pointer`}
        onClick={handleOpen}
      >
        Apply
      </div>
      {user ? (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          className="flex justify-center items-center"
        >
          <div className="absolute inset-10 cust_sm:inset-5  bg-white rounded p-4 ">
            <p className="text-xl font-semibold text-headingColor border-b-2 pb-2 ">
              Application for {competion.title}
            </p>
            {/* {JSON.stringify(answers)} */}

            <form
              onSubmit={submitApplication}
              className="flex flex-col  gap-5 py-4 overflow-y-scroll h-[95%] scrollbar-thin scrollbar-track-slate-200 scrollbar-thumb-slate-500"
            >
              {competion?.stages[0]?.fields?.map((question, index) => {
                return (
                  <QuestionField
                    question={question}
                    index={index}
                    answers={answers}
                    setanswers={setanswers}
                  />
                );
              })}
              {/* {JSON.stringify(competion.stages)} */}
              <button className="bg-headingColor text-sm py-2 text-white rounded">
                Submit
              </button>
            </form>
          </div>
        </Modal>
      ) : (
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <div className="absolute antialiased inset-x-[20%] grid grid-cols-2 cust_sm:grid-cols-1 inset-y-[15%] cust_sm:inset-[10%] cust_sm:inset-y-[25%] bg-white  focus:outline-none rounded-md overflow-hidden ">
            <div className="relative h-full bg-[#3061C0] flex items-center justify-center cust_sm:hidden">
              <div className="px-12 absolute">
                <p className="text-white font-bold text-2xl">
                  Seems like You don't have an account yet.
                </p>
                <p className="text-sm text-gray-100">
                  Create an account to get started
                </p>
              </div>
              <img src={BG.src} />
            </div>
            <div className=" h-full p-6 py-12 cust_sm:p-6 flex flex-col justify-around border cust_sm:w-full gap-2">
              {authStage === 0 ? (
                <>
                  <p className="text-2xl font-semibold text-headingColor antialiased cust_sm:text-lg lg:hidden">
                    Create an account to get started
                  </p>
                  <p className="text-2xl font-semibold text-headingColor antialiased cust_sm:text-lg cust_sm:hidden">
                    Get started
                  </p>
                  <form
                    className=" flex flex-col gap-4"
                    onSubmit={submitHandler}
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold  text-headingColor">
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        defaultValue={creds?.email}
                        className="text-sm px-2 py-2 border rounded"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold  text-headingColor">
                        Password
                      </label>
                      <input
                        required
                        type="password"
                        name="password"
                        defaultValue={creds?.password}
                        className="text-sm px-2 py-2 border rounded"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold  text-headingColor">
                        Confirm Password
                      </label>
                      <input
                        required
                        type="password"
                        name="cpassword"
                        defaultValue={creds?.cpassword}
                        className="text-sm px-2 py-2 border rounded"
                      />
                    </div>
                    {error ? (
                      <p className="text-red-600 font-semibold -my-2 text-xs">
                        Error: {error}
                      </p>
                    ) : (
                      <></>
                    )}
                    <button className="bg-[#2563EB] py-2 text-sm font-semibold text-white rounded hover:scale-105 transition ease-in-out">
                      Sign up
                    </button>
                  </form>
                  <p className="text-sm">
                    Already have an account?{" "}
                    <a
                      className="text-blue-600"
                      href={`/login?redirect=${encodeURI(redirect)}`}
                    >
                      login
                    </a>
                  </p>
                </>
              ) : (
                <div className=" h-full flex flex-col justify-center">
                  <p className="text-center font-semibold text-xl">
                    OTP Verfication
                  </p>
                  <p className=" text-center ">
                    Please enter the OTP sent to <br />
                    <span>
                      {creds.email} &nbsp;{" "}
                      <span
                        className="text-blue-700 font-semibold"
                        onClick={() => {
                          setAuthStage(0);
                        }}
                      >
                        change
                      </span>
                    </span>
                    <br />
                  </p>

                  <div className="h-1/2 flex flex-col  items-center gap-5 justify-center">
                    <form className="flex flex-row flex-wrap gap-4 p-2 ">
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";
                          }
                        }}
                        onChange={(e) => {
                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }
                          if (e.target.value.length > 0) {
                            e.target.nextSibling.focus();
                          }
                        }}
                      />
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";
                            e.target.previousSibling.focus();
                          }
                        }}
                        onChange={(e) => {
                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }
                          if (e.target.value.length > 0) {
                            e.target.nextSibling.focus();
                          }
                        }}
                      />
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";
                            e.target.previousSibling.focus();
                          }
                        }}
                        onChange={(e) => {
                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }
                          if (e.target.value.length > 0) {
                            e.target.nextSibling.focus();
                          }
                        }}
                      />
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";
                            e.target.previousSibling.focus();
                          }
                        }}
                        onChange={(e) => {
                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }
                          if (e.target.value.length > 0) {
                            e.target.nextSibling.focus();
                          }
                        }}
                      />
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";
                            e.target.previousSibling.focus();
                          }
                        }}
                        onChange={(e) => {

                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }

                          if (e.target.value.length > 0) {
                            e.target.nextSibling.focus();
                          }
                        }}
                      />
                      <input
                        className="otpInput border-b-2 w-12 text-center outline-none border-2 p-3"
                        pattern="[0-9]{1}"
                        maxLength="1"
                        onChange={(e) => {

                          if (isNaN(e.target.value)) {
                            e.target.value = "";
                          }
                        }}

                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.target.value = "";

                            if (e.target.previousSibling) {
                              e.target.previousSibling.focus();
                            }
                          }
                        }}
                      />
                    </form>

                    <div
                      className="text-white text-sm bg-actionbtnBlue w-full py-2 text-center rounded shadow cursor-pointer hover:shadow-lg"
                      onClick={verifyHandler}
                    >
                      Verify
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-center">
                    <p>
                      didn't receive your code?{" "}
                      <span className="text-blue-700">RESEND</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export const QuestionField = ({ question, index, answers, setanswers }) => {
  return (
    <div className="flex flex-col gap-2" key={question.question_id}>
      <label className=" text-headingColor capitalize">
        {index + 1}. {question.question}
      </label>
      <AnswerField
        answerOptions={question.answerOptions}
        question_id={question.question_id}
        answers={answers}
        setanswers={setanswers}
      />
      {/* {JSON.stringify(question.answerOptions)} */}
    </div>
  );
};

const AnswerField = ({ answerOptions, question_id, answers, setanswers }) => {
  const textChangeHandler = (e, answerOptions) => {
    if (parseInt(answerOptions.options.maxChar)) {
      e.target.value = e.target.value.slice(0, answerOptions.options.maxChar);
    }
  };

  const numberChangeHandler = (e, answerOptions) => {
    if (answerOptions.options.min) {
    }
  };
  const tableRowAddHandler = (e, colheaders) => {

    const tableBody = document.getElementById("table-body");
    if (!answers[question_id]) {
      answers[question_id] = [
        {
          id: uuid(),
          values: colheaders.map((item) => ""),
        },
      ];
    } else {
      answers[question_id].push({
        id: uuid(),
        values: colheaders.map((item) => ""),
      });
    }
    setanswers({ ...answers });
  };

  const onMultipleOptionsSelect = (e) => {
    if (e.target.checked) {
      if (answers[question_id]) {
        answers[question_id].push(e.target.value);
      } else {
        answers[question_id] = [e.target.value];
      }
    }
    if (!e.target.checked) {
      if (answers[question_id]) {
        answers[question_id] = answers[question_id].filter(
          (item) => item !== e.target.value
        );
      }
    }
    setanswers({ ...answers });
  };

  if (answerOptions.type === "text") {
    return (
      <div>
        <textarea
          required
          className="border p-1 text-sm rounded px-2 w-full"
          name={question_id}
          onChange={(e) => textChangeHandler(e, answerOptions)}
        />
        {parseInt(answerOptions.options.maxChar) ? (
          <p className="text-xs text-gray-500">
            maximum of {answerOptions.options.maxChar} characters allowed
          </p>
        ) : (
          <></>
        )}
      </div>
    );
  }
  const onColumnSelect = (e) => {};

  if (answerOptions.type === "number") {
    return (
      <div>
        <input
          required
          className="border p-1 text-sm rounded px-2 w-full"
          type="number"
          name={question_id}
          min={answerOptions.options.min}
          max={answerOptions.options.max}

          // onChange={}
        />
      </div>
    );
  }
  if (answerOptions.type === "singleChoice") {
    return (
      <div className="flex flex-row flex-wrap gap-4">
        {answerOptions.options.values.map((choice) => {
          return (
            <div className="flex flex-row items-center gap-2 capitalize">
              <input
                required
                type="radio"
                name={question_id}
                value={choice}
                className="text-sm "
              />
              <label className="text-sm">{choice}</label>
            </div>
          );
        })}
      </div>
    );
  }
  if (answerOptions.type === "multipleChoice") {
    return (
      <div className="flex flex-row flex-wrap gap-4">
        {answerOptions.options.values.map((choice, index) => {
          return (
            <div className="flex flex-row items-center gap-3 capitalize">
              <input
                type="checkbox"
                name={question_id}
                value={choice}
                className="text-sm "
                onChange={onMultipleOptionsSelect}
              />
              <label className="text-sm">{choice}</label>
            </div>
          );
        })}
      </div>
    );
  }
  if (answerOptions.type === "file") {
    return (
      <div>
        <input required type="file" name={question_id} />
      </div>
    );
  }
  if (answerOptions.type === "table") {
    return (
      <div className="mr-4">
        <table className="border w-full text-sm ">
          <thead>
            <tr>
              <td className="p-2 border">Sl no</td>
              {answerOptions.options.rowHeaders.map((rowHeader) => {
                return (
                  <td className="capitalize border border-collapse p-2  ">
                    {rowHeader}
                  </td>
                );
              })}
              <td className="border p-2">Action</td>
            </tr>
          </thead>
          <tbody id="table-body">
            {/* {answerOptions.options.rowHeaders.map((rowHeader, index) => {
                return (
                  <td className="capitalize border-collapse  border ">
                    <input
                      required
                      type="text"
                      className=" h-full w-full p-2 "
                      onChange={() => {
                        if (answers[question_id]) {
                          answers[question_id][index] = e.target.value;
                        } else {
                          answers[question_id] = {};
                        }
                      }}
                    />
                  </td>
                );
              })} */}
            {answers[question_id] ? (
              <>
                {answers[question_id].map((rowValues, rowIndex) => {
                  return (
                    <tr key={rowValues.id}>
                      <td className="border p-2">{rowIndex + 1}</td>
                      {rowValues?.values.map((value, index) => {
                        return (
                          <td className="capitalize border-collapse  border ">
                            <input
                              required
                              type="text"
                              className="h-full w-full p-2 "
                              onChange={(e) => {
                                if (answers[question_id]) {
                                  answers[question_id][rowIndex].values[index] =
                                    e.target.value;
                                } else {
                                  answers[question_id] = {};
                                }
                                setanswers({ ...answers });
                              }}
                            />
                          </td>
                        );
                      })}
                      {/* {JSON.stringify(rowValues)} */}
                      <td
                        className="text-sm border p-2 text-red-700 cursor-pointer"
                        onClick={() => {
                          answers[question_id].splice(rowIndex, 1);
                          setanswers({ ...answers });
                        }}
                      >
                        {" "}
                        Delete
                      </td>
                    </tr>
                  );

                  // return ()
                })}
              </>
            ) : (
              <></>
            )}
          </tbody>
        </table>
        <div className="flex flex-row-reverse">
          <span
            className="bg-actionbtnBlue p-2 mt-2 text-sm text-white rounded px-4"
            onClick={(e) => {
              tableRowAddHandler(e, answerOptions.options.rowHeaders);
            }}
          >
            Add Row
          </span>
        </div>
      </div>
    );
  }
};
