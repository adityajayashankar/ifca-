// import React, { useEffect, useMemo, useRef, useState } from "react";
// import dynamic from "next/dynamic";
// import "react-quill/dist/quill.snow.css";
// import { IoSend } from "react-icons/io5";
// import { AiOutlineSend } from "react-icons/ai";

// // components
// // import LoadBtn from '@/com/common/loadBtn';

// import LoadBtn from "@/components/common/loadBtn";
// import Modal from "../common/Modal";
// import BetterUploaderImg from "../common/BetterImgUploader";

// /*
//         Theme of the Quill Board :
//         1. Snow
//         2. Bubble
// */

// const QuillNoSSRWrapper = dynamic(import("react-quill"), {
//   ssr: false,
//   loading: () => <p>Loading ...</p>,
// });

// const Markup = ({ data, setData, status, onClick, noSend }) => {
//   const [visibleUploader, setVisibleUploader] = useState(false);
//   const [imgUrl, setImgUrl] = useState("");
//   let quillObj = useRef();
//   // useEffect(() => {
//   //   console.log(quillObj);
//   // }, [quillObj]);
//   // const quillRef = useRef();
//   function handleImgClick() {
//     // setVisibleUploader(true);
//     // const range = quillRef.current.getEditorSelection();
//     console.log(quillObj.current);
//     // const editor = quillRef.current.getEditor;
//     // console.log(editor);
//     // editor.insertEmbed(
//     //   editor.getSelection(),
//     //   "image",
//     //   "https://d38yuuqgpa2kr1.cloudfront.net/imgs/lovebabbe.jpg"
//     // );
//   }

//   const modules = useMemo(
//     () => ({
//       toolbar: {
//         container: [
//           [{ header: [1, 2, 3, 4, 5, 6, false] }],
//           ["bold", "italic", "underline", "strike", "blockquote"],
//           [
//             { list: "ordered" },
//             { list: "bullet" },
//             { indent: "-1" },
//             { indent: "+1" },
//           ],
//           [{ align: [] }],
//           ["link", "image"],
//           ["clean"],
//         ],
//         handlers: {
//           image: () => {
//             console.log(`image uploading`);
//             console.log(quillObj.current);
//           },
//         },
//       },
//     }),
//     []
//   );

//   const formats = [
//     "bold",
//     "italic",
//     "underline",
//     "strike",
//     "blockquote",
//     "list",
//     "bullet",
//     "indent",
//     "link",
//     "image",
//   ];

//   // function setFocus(editor) {
//   //   editor?.focus();
//   // }

//   return (
//     <div className="flex bg-white  justify-center">
//       {/* <div className="flex w-full flex-row bg-white  p-3 "> */}
//       <div className="w-full text-black border-none">
//         <QuillNoSSRWrapper
//           value={data}
//           ref={(el) => {
//             console.log(`Setting ref`);
//             console.log(el);
//             quillObj.current = el;
//           }}
//           className=""
//           modules={modules}
//           required={true}
//           onEditorCreated={(editor) => setFocus(editor)}
//           formats={formats}
//           onKeyUp={(e) => {
//             if (e.code === "Enter" && e.shiftKey === false) {
//               e.preventDefault();
//               // if (status) {
//               //   onClick();
//               // }
//             }
//           }}
//           placeholder={"Start with a why"}
//           onChange={(e) => {
//             setData(e);
//           }}
//           style={{ wordBreak: "break-all", color: "black" }}
//           theme="snow"
//         />
//       </div>
//       {/* </div> */}
//       <Modal
//         showModal={visibleUploader}
//         setShowModal={setVisibleUploader}
//         title="Upload Image"
//       >
//         <BetterUploaderImg videoURL={imgUrl} setVideoURL={setImgUrl} />
//       </Modal>
//     </div>
//   );
// };

// export default Markup;

import React, { useState } from "react";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
// import Modal from "@material-ui/core/Modal";
// import Button from "@material-ui/core/Button";
import "node_modules/react-quill/dist/quill.snow.css";
import Modal from "../common/Modal";
import BetterUploaderImg from "../common/BetterImgUploader";
import axios from "axios";
import { cloudFrontURL, videoURLs } from "@/utils/videoAPIutil";
// import "node_modules"

class BlogMarkup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorHtml: props.data,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(html) {
    this.props.setData(html);
    this.setState((prev) => ({ ...prev, editorHtml: html }));
  }

  apiPostNewsImage() {
    // API post, returns image location as string e.g. 'http://www.example.com/images/foo.png'
  }

  imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      const formData = new FormData();

      formData.append("file", file);
      let imgURL = "";
      let success = false;
      const resp = await axios.post(
        `${videoURLs[process.env.NODE_ENV]}/img`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (p) => {
            imgURL = `${cloudFrontURL}/imgs/${file.name}`;
          },
        }
      );
      if (resp) {
        success = true;
      }

      // Save current cursor state
      const range = this.quill.getSelection(true);

      // Insert temporary loading placeholder image
      this.quill.editor.formatText(range.index, range.length, "size", "60px");

      if (resp) {
        this.quill.insertEmbed(range.index, "image", imgURL);
        // Move cursor to right side of image (easier to continue typing)
        this.quill.setSelection(range.index + 1);
      }

      // const res = await apiPostNewsImage(formData); // API post, returns image location as string e.g. 'http://www.example.com/images/foo.png'

      // // Remove placeholder image
      // this.quill.deleteText(range.index, 1);

      // // Insert uploaded image
      // this.quill.insertEmbed(range.index, 'image', res.body.image);
      // this.quill.insertEmbed(range.index, 'image', res);
    };
    // this.setState((prev) => ({ ...prev, visibleUploader: true }));
    // try {
    //   const url = await this.handleUploadWait();
    //   const range = this.quill.getSelection(true);

    //   console.log(url);
    //   // Insert temporary loading placeholder image
    //   this.quill.insertEmbed(range.index, "image", url.url);

    //   this.quill.setSelection(range.index + 1);
    // } catch (error) {
    //   console.log(`Error occured`);
    //   console.log(error);
    // }
  }

  render() {
    return (
      <div className="text-editor">
        <hr />
        <ReactQuill
          ref={(el) => {
            this.quill = el;
          }}
          onChange={this.handleChange}
          placeholder={this.props.placeholder}
          defaultValue={this.state.editorHtml}
          // value={this.state.editorHtml}
          modules={{
            toolbar: {
              container: [
                [
                  { header: "1" },
                  { header: "2" },
                  { header: [3, 4, 5, 6] },
                  { font: [] },
                ],
                [{ size: [] }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
                ["code-block"],
              ],
              handlers: {
                image: this.imageHandler,
              },
            },
          }}
        />
        {/* <Modal
          showModal={this.state.visibleUploader}
          setShowModal={this.setVisibility}
          title="Add Image"
        >
          <BetterUploaderImg
            videoURL={this.state.imgUrl}
            setVideoURL={this.setImgUrl}
            setError={this.handleError}
          />
        </Modal> */}
      </div>
    );
  }
}

export default BlogMarkup;
