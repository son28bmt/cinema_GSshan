const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cinema";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const uploadimage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_PUBLIC_DOMAIN
    ) {
      console.error("Missing R2 environment variables");
      return res
        .status(500)
        .json({ message: "Server storage configuration error" });
    }

    const fileStream = fs.createReadStream(req.file.path);
    const fileName = `${Date.now()}-${req.file.originalname.replace(
      /\s+/g,
      "-"
    )}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: fileStream,
        ContentType: req.file.mimetype,
      },
    });

    await upload.done();

    // Clean up local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const publicUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;

    // Return format matches what frontend expects: { success: true, result: { variants: [url] } }
    // Or we can adapt frontend. Let's adapt response to keep frontend happy if possible, or simple json.
    // Previous Cloudflare Images returned: result.variants[0]
    // Let's verify frontend: It uses `uploadData.result.variants[0]`

    return res.status(200).json({
      success: true,
      result: {
        variants: [publicUrl],
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("R2 Upload Error:", error);
    return res
      .status(500)
      .json({ message: "Upload failed", error: error.message });
  }
};

module.exports = {
  uploadimage,
};
