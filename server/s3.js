import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
  } from "@aws-sdk/client-s3"; //npm install @aws-sdk/client-s3
import { v4 as uuidv4 } from 'uuid'; // You'd need to install the 'uuid' package

export class ResumeS3DAO{
    BUCKET = "job-extension-bucket";
    REGION = "us-west-2";

    generateFileName(){
        const uniqueId = uuidv4();
        return `${uniqueId}`;
    }

    async putResume(
        resumeStringBase64Encoded,
        resumeFileExtension
      ) {
        const receivedUint8Array = new Uint8Array(Object.values(resumeStringBase64Encoded));
        const pdfBuffer = Buffer.from(receivedUint8Array, 'base64');

        let randomName = this.generateFileName(); // randomly generated
        let filename = "resume/" + randomName + "." + resumeFileExtension;
        const s3Params = {
          Bucket: this.BUCKET,
          Key: filename,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        };
        const c = new PutObjectCommand(s3Params);
        const client = new S3Client({ region: this.REGION });
        try {
          await client.send(c);
          return filename;
        } catch (error) {
          throw Error("s3 put resume failed with: " + error);
        }
      }

    async getResume(resumeUrl){
        const client = new S3Client({ region: this.REGION });
        const command = new GetObjectCommand({
            Bucket: this.BUCKET,
            Key: resumeUrl
        });
        const response = await client.send(command);
        const resumeBuffer = await response.Body?.transformToByteArray();

        if(resumeBuffer === undefined){
            throw new Error("resume not found");
        }
        return resumeBuffer;
    }
}