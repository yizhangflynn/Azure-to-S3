const AWS = require('aws-sdk');
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { get } from 'config';

const sourceContainer = process.env.SOURCE_CONTAINER || get('sourceContainer');
const targetBucket = process.env.TARGET_BUCKET || get('targetBucket');
const azureBlobClient = getAzureBlobClient();
const s3Client = new AWS.S3();
const { region, key, secret } = get<any>('aws');

AWS.config.update({
    region: region,
    accessKeyId: key,
    secretAccessKey: secret
});

function getAzureBlobClient(): BlobServiceClient {
    const { account, key } = get<any>('azure');
    const url = `https://${account}.blob.core.windows.net`;
    const credential = new StorageSharedKeyCredential(account, key);

    return new BlobServiceClient(url, credential);
}

async function downloadFromAzureBlob(container: ContainerClient, blobName: string): Promise<NodeJS.ReadableStream> {
    const downloaded = await container.getBlobClient(blobName).download();

    return downloaded.readableStreamBody;
}

async function uploadToS3(bucket: string, objectKey: string, file: NodeJS.ReadableStream): Promise<any> {
    const payload = { Bucket: bucket, Key: objectKey, Body: file };

    return new Promise((resolve, reject) => {
        s3Client.upload(payload, (error: Error, data: any) => {
            if (error) {
                reject(`Failed to upload ${objectKey} into bucket ${bucket}. Error: ${error.name}, message: ${error.message}.`)
            }

            if (data) {
                resolve(`Successfully uploaded ${objectKey} into bucket ${bucket}.`);
            }

            reject(`Failed to upload ${objectKey} into bucket ${bucket}.`);
        });
    });
}

async function migrate(source: string, target: string): Promise<void> {
    const container = azureBlobClient.getContainerClient(source);
    const blobs = await container.listBlobsFlat();

    for await (const blob of blobs) {
        const file = await downloadFromAzureBlob(container, blob.name);
        const delimiter = blob.name[0] === '/' ? '' : '/';
        const objectKey = `${source}${delimiter}${blob.name}`;
        const result = await uploadToS3(target, objectKey, file);
        console.log(`${result}\n`);
    }
}

migrate(sourceContainer, targetBucket);
