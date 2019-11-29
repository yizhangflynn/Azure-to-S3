import { get } from 'config';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const azureConfig = get<{ account: string, key: string }>('azure');
const azureCredential = new StorageSharedKeyCredential(azureConfig.account, azureConfig.key);
const azureClient = new BlobServiceClient(`https://${azureConfig.account}.blob.core.windows.net`, azureCredential);

async function listAzureBlobsByContainer(name: string): Promise<void> {
    const container = azureClient.getContainerClient(name);
    const blobs = await container.listBlobsFlat();

    for await (const blob of blobs) {
        console.log(blob.name);
    }
}

listAzureBlobsByContainer('attachments').catch(error => console.log(error));
