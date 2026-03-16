import React, { useState } from "react";

const InfoForm = ({ id, data, setData }) => {
  const [points, setPoints] = useState(data.points);
  const [title, setTitle] = useState(data.title);
  const handleChange = (e) => {
    if (e.target.name === "title") {
      setTitle(e.target.value);
      setData(id, "title", e.target.value);
    } else {
      const [index, name] = e.target.name.split("-");
      let temp = points;
      temp[index][name] = e.target.value;
      setPoints(temp);
      setData(
        id,
        "points",
        temp.map((item, index) => ({ ...item, index: index + 1 }))
      );
    }
  };
  const handleRemovePoint = (index) => {
    let temp = points.filter((item, i) => i !== index);
    setPoints(temp);
    setData(
      id,
      "points",
      temp.map((item, index) => ({ ...item, index: index + 1 }))
    );
  };

  const handleAddPoint = (e) => {
    e.preventDefault();
    let init = { subHeader: "subheader", main: "main" };
    let temp = JSON.parse(JSON.stringify(points));
    temp.push(init);
    setPoints(temp);
    setData(
      id,
      "points",
      temp.map((item, index) => ({ ...item, index: index + 1 }))
    );
  };
  return (
    <div>
      <label htmlFor="name" className="label">
        <span className="label__text">Section Title</span>
        <input
          type="text"
          id="name"
          name="title"
          className="input font-semibold text-lg"
          required
          value={title==="thisistitle"?"":title}
          onChange={handleChange}
        />
      </label>
      {points.map((item, index) => (
        <div key={`points-${index}-${data.title}`}>
          <label htmlFor="name" className="label">
            <span className="label__text">SubHeader</span>
            <input
              type="text"
              id="name"
              name={`${index}-subHeader`}
              className="input"
              required
              defaultValue={item.subHeader}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="name" className="label">
            <span className="label__text">Content</span>
            <textarea
              //   type="text"
              //   id="name"
              name={`${index}-main`}
              className="input"
              cols={30}
              //   required
              defaultValue={item.main}
              onChange={handleChange}
            />
          </label>
          <button
            className="btn btn-red m-4"
            onClick={() => handleRemovePoint(index)}
          >
            Remove point
          </button>
        </div>
      ))}
      <button className="btn btn-green m-4" onClick={handleAddPoint}>
        Add Point
      </button>
    </div>
  );
};

export default InfoForm;
