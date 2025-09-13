const {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

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

module.exports = { s3Client, deleteFileFromS3, PutObjectCommand };
