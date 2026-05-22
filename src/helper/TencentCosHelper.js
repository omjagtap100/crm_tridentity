import COS from 'cos-nodejs-sdk-v5';
import multer from 'multer';
import * as fs from 'fs';
import envConfig from '../config/config.js';
import mime from 'mime-types';

const bucket = envConfig.bucket.TENCENT_BUCKET;
const region = envConfig.bucket.TENCENT_BUCKET_REGION;
const cos = new COS({
  SecretId: envConfig.bucket.TENCENT_SECRET_ID,
  SecretKey: envConfig.bucket.TENCENT_SECRET_KEY, 
});

export class TencentCosHelper {
  async uploadFile(path, filename, folder) {
    const key = `${folder}/cos-${filename}`;
    const contentType = mime.lookup(filename) || 'application/octet-stream';
    // pulic/cos-filename
   return new Promise((res, rej) => {
  cos.putObject(
    {
      Bucket: bucket,
      Region: region,
      Key: key,
      StorageClass: 'STANDARD',
      Body: fs.createReadStream(path),
      ContentLength: fs.statSync(path).size,
       ContentType: contentType,
       ContentDisposition: 'inline',
      ACL: 'public-read'
    },
    async (err, data) => {
      fs.unlinkSync(path);

      if (err) {
        console.error('COS upload error:', err);
        return rej({ message: 'Failed to upload to COS', error: err });
      }

      try {
        const fileUrl = await this.getFile(key);
        console.log('fileUrl', fileUrl);
        return res({ ok: true, fileUrl, filename: key, originalName: filename });
      } catch (e) {
        return rej({ message: 'Failed to get file URL', error: e });
      }
    }
  );
});

  }

  async getFile(filename) {
    return new Promise((res, rej) => {
      const key = decodeURIComponent(filename);
      // Try to get the object's ACL to check if it's public
      cos.getObjectAcl(
        {
          Bucket: bucket, // Replace with your actual bucket name
          Region: region, // Replace with your region
          Key: key,
        },
        (err, aclData) => {
          console.log("aclData",aclData);
          console.log("aclData",aclData.Grants);

          if (err) {
            console.error('ACL fetch failed:', err);
            rej({ ok: false, error: 'File not found or permission denied' });
          }

          if(aclData){
            const grants = aclData.Grants || [];
            const isPublic = grants.some(
              (grant) =>
                grant.Permission === 'READ' &&
                grant.Grantee.URI ===
                  'http://cam.qcloud.com/groups/global/AllUsers'
            );

            if (isPublic) {
              // If object is public, return the direct URL
              const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
              res(url);
            }

            // If not public, generate a signed URL
            cos.getObjectUrl(
              {
                Bucket: bucket,
                Region: region,
                Key: key,
                Sign: true,
                Expires: 300, // 5 minutes
              },
              (err, data) => {
                if (err) {
                  console.error('Signed URL generation failed:', err);
                  rej({ ok: false, error: 'Could not generate signed URL' });
                }
                res(data.Url);
              }
            );
          }
        }
      );
    });
  }
}

// Singleton instance used across upload services
export const cosHelper = new TencentCosHelper();
