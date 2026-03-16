const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
});

exports.generateuploadUrl = async (req, res) => {
    try {
        const { fileName, fileType, folder } = req.body;

        if (!fileName || !fileType || !folder) {
            return res.status(400).json({ error: 'File name, file type, and folder are required' });
        }

        // Construct the file path based on the folder name
        const filePath = `${folder}/${Date.now()}-${fileName}`;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filePath,
            ContentType: fileType,
            Expires: 60, // URL valid for 60 seconds
        };

        const signedUrl = await s3.getSignedUrlPromise('putObject', params);

        res.json({
            uploadUrl: signedUrl,
            fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`,
        });

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Error generating upload URL' });
    }
};

