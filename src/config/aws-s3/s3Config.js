const {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

require("dotenv").config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//  delete file from s3 bucket
const deleteFileFromS3 = async (key) => {
  const details = {
    Key: key,
    Bucket: process.env.S3_BUCKET_NAME,
  };
  try {
    await s3Client.send(new DeleteObjectCommand(details));
    return true;
  } catch (error) {
    throw error;
  }
};

const genratePresignedURL = async (files) => {
  // files = [{ fileName: "test.png", fileType: "image/png" }, { fileName: "hello.jpg", fileType: "image/jpeg" }]
  const results = [];

  for (const file of files) {
    const key = `kyc_documents/${Date.now()}-${file.fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: file.fileType,
      ACL: "public-read",
    });

    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    results.push({
      uploadURL,
      fileURL: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  }

  return results;
};
// (async () => {
//   try {
//     const reuslt = await genratePresignedURL([
//       { fileName: "test.png", fileType: "image/png" },
//       { fileName: "hello.jpg", fileType: "image/jpeg" },
//       { fileName: "xyz.pdf", fileType: "application/pdf" },
//     ]);
//     console.log("url", reuslt);
//   } catch (err) {
//     console.log("err", err);
//   }
// })();
module.exports = {
  s3Client,
  deleteFileFromS3,
  PutObjectCommand,
  genratePresignedURL,
};
