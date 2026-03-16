export const verifyCompetitionInput = (competitionDetails, stages) => {
  if (!competitionDetails.title) {
    return [null, "Competition Title is required"];
  }
  if (!competitionDetails.description) {
    return [null, "Competition Description is required"];
  }
  if (!competitionDetails.banner) {
    return [null, "Banner Image is required"];
  }

  if (!competitionDetails.startDate) {
    return [null, "Start Date is required"];
  }
  if (!competitionDetails.endDate) {
    return [null, "End Date is required"];
  }

  if (
    new Date(competitionDetails.startDate) >
    new Date(competitionDetails.endDate)
  ) {
    return [null, "Start Date cannot be greater than End Date"];
  }

  // if

  if (!competitionDetails.application_ends_on) {
    return [null, "Application End Date is required"];
  }
  if (!competitionDetails.domains.length) {
    return [null, "Atleast One Domain is required"];
  }
  if (!competitionDetails.description.length) {
    return [null, "Atleast One Description is required"];
  }

  if (!stages.length) {
    return [null, "Atleast One Stage is required"];
  }

  for (let i = 0; i < stages.length; i++) {
    const element = stages[i];
    if (!element.evaluators.length) {
      return [null, "Please select evaluators for stage-" + (i + 1)];
    }
    if (!element.fields.length) {
      return [null, "Please add questions for stage-" + (i + 1)];
    }
    for (
      let questionIndex = 0;
      questionIndex < element.fields.length;
      questionIndex++
    ) {
      const field = element.fields[questionIndex];
      if (!field.question.length) {
        return [
          null,
          "Question is required for stage-" +
            (i + 1) +
            ",question-" +
            (questionIndex + 1),
        ];
      }
      if (!Object.keys(field.answerOptions).length) {
        return [
          null,
          `Select the type of answer you are expecting for stage-${
            i + 1
          } question-${questionIndex + 1}`,
        ];
      }
      if (
        (field.answerOptions.type === "singleChoice" ||
          field.answerOptions.type === "multipleChoice") &&
        field.answerOptions.options.values.length <= 1
      ) {
        return [
          null,
          `Add more options for ${
            field.answerOptions.type === "multipleChoice"
              ? "multiple"
              : "single"
          } choice question in stage-${i + 1} question-${questionIndex + 1}`,
        ];
      }
      if (
        field.answerOptions.type === "table" &&
        field.answerOptions.options.rowHeaders.length <= 1
      ) {
        return [
          null,
          "Add more column headers for table in stage-" +
            (i + 1) +
            " question-" +
            (questionIndex + 1),
        ];
      }
      //   if()
    }

    for (
      let evaluator_question = 0;
      evaluator_question < element.evaluatorQuestion.length;
      evaluator_question++
    ) {
      const evalQuestion = element.evaluatorQuestion[evaluator_question];
      console.log(evalQuestion);
      if (!evalQuestion.question.length) {
        return [
          null,
          "Question is required for evaluator question-" +
            (evaluator_question + 1) +
            " in stage-" +
            (i + 1),
        ];
      }
    }
  }

  return [true, null];
};
