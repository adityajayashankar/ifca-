const AWS = require('aws-sdk');
const axios = require('axios');
require('dotenv').config();

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async uploadImage(buffer, folder, fileName) {
    const key = `${folder}/${fileName}`;
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
      // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
    };

    try {
      await this.s3.putObject(params).promise();
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw error;
    }
  }

  async uploadVideo(buffer, folder, fileName) {
    const key = `${folder}/${fileName}`;
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'video/mp4'
      // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
    };

    try {
      await this.s3.putObject(params).promise();
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading video to S3:', error);
      throw error;
    }
  }

  async uploadFromUrl(url, folder, fileName) {
    try {
      // Download file from URL
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      });
      const buffer = Buffer.from(response.data);
      
      // Determine content type based on URL or file extension
      let contentType = 'image/jpeg';
      if (url.includes('.mp4') || url.includes('.mov') || url.includes('video')) {
        contentType = 'video/mp4';
      } else if (url.includes('.png')) {
        contentType = 'image/png';
      } else if (url.includes('.gif')) {
        contentType = 'image/gif';
      } else if (url.includes('.webp')) {
        contentType = 'image/webp';
      }
      
      const key = `${folder}/${fileName}`;
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
        // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
      };

      await this.s3.putObject(params).promise();
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading from URL to S3:', error);
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };
      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  async getFileUrl(key) {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}

module.exports = new S3Service();
