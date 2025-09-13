// services/s3Service.js
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3Client");
const path = require("path");

const BUCKET = process.env.S3_BUCKET_NAME;

const uploadFileBuffer = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: BUCKET,
    Key: `uploads/${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    const result = await s3Client.send(new PutObjectCommand(params));
    return {
      success: true,
      fileUrl: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`,
      s3Response: result,
    };
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw err;
  }
};

module.exports = {
  uploadFileBuffer,
};
