// api/savepdf.js

// import PDFDocument from "pdfkit";
import axios from "axios";
import fs from "fs";
// import aws from "aws-sdk";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import process from "process";
import { http } from "../../lib/modules/http/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //Send the data for the pdf in the request as query params such as the title and filename
  const {
    query: { title, filename = "test" },
  } = req;

  let response = await axios({
    baseURL:
      "http://alb-dangabay-1a-702507269.ap-southeast-1.elb.amazonaws.com:81/api/v4",
    url: "/documents/3/files/3/download/",
    headers: {
      Authorization: `Token 557347dffddcae45f0d00b4330aeac985bb42eb3`,
    },
    method: "GET",
    responseType: "arraybuffer",
    responseEncoding: "binary",
    // responseType: "blob",
  });

  console.log("response.data:", response.data);
  //response.data will be binary encoded buffer Array of pdf data

  //*To convert to base64*
  var base64 = response.data.toString("base64");
  // console.log("base64:", base64);

  //to convert to binary
  var binary = response.data.toString("binary");
  // console.log('binary:', binary)

  // if file exist if not create it
  if (!fs.existsSync(path.join(process.cwd() + "/tmp"))) {
    fs.mkdirSync(path.join(process.cwd() + "/tmp"), { recursive: true });
    fs.writeFileSync(
      process.cwd() + `/tmp/${filename}.pdf`,
      response.data,
      "binary"
    );
  } else {
    fs.writeFileSync(
      process.cwd() + `/tmp/${filename}.pdf`,
      response.data,
      "binary"
    );
  }

  res
    .status(201)
    .json({
      message: `File ${filename} saved to /tmp folder in your local`,
      currentDir: process.cwd(),
    });

  // const doc = new PDFDocument();
  //use the tmp serverless function folder to create the write stream for the pdf
  // let writeStream = fs.createWriteStream(`/tmp/${filename}.pdf`);
  // fs.writeFileSync(`./tmp/${filename}.pdf`, JSON.stringify(body));
  // doc.pipe(writeStream);
  // doc.text(title);
  // doc.end();

  // writeStream.on("finish", function () {
  //   //once the doc stream is completed, read the file from the tmp folder
  //   const fileContent = fs.readFileSync(`/tmp/${filename}.pdf`);
  //   //create the params for the aws s3 bucket
  //   var params = {
  //     Key: `${filename}.pdf`,
  //     Body: fileContent,
  //     Bucket: "your-s3-bucket-name",
  //     ContentType: "application/pdf",
  //   };

  //   //Your AWS key and secret pulled from environment variables
  //   const s3 = new aws.S3({
  //     accessKeyId: process.env.YOUR_AWS_KEY,
  //     secretAccessKey: process.env.YOUR_AWS_SECRET,
  //   });

  //   s3.putObject(params, function (err, response) {
  //     res.status(200).json({ response: `File ${filename} saved to S3` });
  //   });
  // });
}

// function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
//   const sep = path.sep;
//   const initDir = path.isAbsolute(targetDir) ? sep : "";
//   const baseDir = isRelativeToScript ? __dirname : ".";

//   return targetDir.split(sep).reduce((parentDir, childDir) => {
//     const curDir = path.resolve(baseDir, parentDir, childDir);
//     try {
//       fs.mkdirSync(curDir);
//     } catch (err) {
//       if (err.code === "EEXIST") {
//         // curDir already exists!
//         return curDir;
//       }

//       // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
//       if (err.code === "ENOENT") {
//         // Throw the original parentDir error on curDir `ENOENT` failure.
//         throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
//       }

//       const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
//       if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
//         throw err; // Throw if it's just the last created dir.
//       }
//     }

//     return curDir;
//   }, initDir);
// }
