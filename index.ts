import * as Hapi from "hapi";
import * as Boom from "boom";
import * as path from "path";
import * as fs from "fs";
import * as Loki from "lokijs";

import {
  loadCollection, uploader
} from "./utils";

// setup
const DB_NAME = "db.json";
const COLLECTION_NAME = "image";
const UPLOAD_PATH = "uploads";
const fileOptions: FileUploaderOption = { dest: `${UPLOAD_PATH}/` };
const db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, {persistenceMethod: "fs"});

// create folder for upload if not exists
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH);

// app

const app = new Hapi.Server();
app.connection({
  port: 3001, host: "localhost",
  routes: { cors: true }
});

// start app
app.start((err) => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${app.info.uri}`);
});

app.route({
  method: "POST",
  path: "/profile",
  config: {
    payload: {
      output: "stream",
      allow: "multipart/form-data" // important
    }
  },
  handler: async function (request, reply) {
      try {
        const data = request.payload;
        const file = data["avatar"]; // accept a file call avatar

        // save the file
        const fileDetails = await uploader(file, fileOptions);

        // save data to database
        const col = await loadCollection(COLLECTION_NAME, db);
        const result = col.insert(fileDetails);
        db.saveDatabase();

        // return result
        reply({ id: result.$loki, fileName:  result.filename, originalName: result.originalname });
      } catch (err) {
        // error handling
        reply(Boom.badRequest(err.message, err));
      }
  }
});
