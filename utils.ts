import * as del from "del";
import * as Loki from "lokijs";
import * as fs from "fs";
import * as uuid from "uuid";

const imageFilter = function (fileName: string) {
  // accept image formats only
  if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
    return false;
  }
  return true;
};

const loadCollection = function (colName, db: Loki ): Promise<LokiCollection<any>> {
  return new Promise(resolve => {
    db.loadDatabase({}, () => {
      const _collection = db.getCollection(colName) || db.addCollection(colName);
      resolve(_collection);
    });
  });
};

const uploader = function (file: any, options: FileUploaderOption) {
  if (!file) throw new Error ("no file(s)");

  return _fileHandler(file, options);
};

const _fileHandler = function (file: any, options: FileUploaderOption) {
  if (!file) throw new Error("no file(s)");

  // apply filter if exist
  if (options.fileFilter && !options.fileFilter(file.hapi.filename)) {
    throw new Error("type not allowed");
  }

  const originalName = file.hapi.filename;
  const filename = uuid.v1();
  const path = `${options.dest}${filename}`;
  const fileStream = fs.createWriteStream(path);

  return new Promise((resolve, reject) => {
    file.on("error", function (err) {
      reject(err);
    });

    file.pipe(fileStream);
    file.on("end", function (err) {
      const fileDetails: FileDetails = {
        fieldname: file.hapi.name,
        originalname: file.hapi.filename,
        filename,
        mimetype: file.hapi.headers["content-type"],
        destination: `${options.dest}`,
        path,
        size: fs.statSync(path).size,
      };

      resolve(fileDetails);

    });
  });
};

export { imageFilter, loadCollection, uploader }
