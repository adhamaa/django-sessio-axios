// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

type Data = {
  name: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body } = req;

  try {
    switch (method) {
      case "GET": {
        // read
        // This line opens the file as a readable stream
        const readStream = fs.createReadStream("/tmp/text.txt");

        // This will wait until we know the readable stream is actually valid before piping
        readStream.on("open", function () {
          // This just pipes the read stream to the response object (which goes to the client)
          readStream.pipe(res);
        });

        // This catches any errors that happen while creating the readable stream (usually invalid names)
        readStream.on("error", function (err) {
          res.end(err);
        });
        return;
      }
      case "POST":
        // write
        fs.writeFileSync("./test.txt", JSON.stringify(body));
        break;
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
    // send result
    return res.status(200).json({ message: "Success" });
  } catch (error) {
    return res.status(500).json(error);
  }
}
