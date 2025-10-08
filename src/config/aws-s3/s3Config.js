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

const generatePresignedURL = async (fileName, fileType) => {
  const key = `kyc_documents/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ACL: "public-read", // secure by default
  });

  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  return {
    uploadURL,
    fileURL: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

module.exports = {
  s3Client,
  deleteFileFromS3,
  PutObjectCommand,
  generatePresignedURL,
};
