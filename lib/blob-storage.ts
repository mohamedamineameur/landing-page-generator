import "server-only";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

let cachedContainerClient: ContainerClient | null = null;
let cachedContainerReadyPromise: Promise<ContainerClient> | null = null;

function getStorageConfig() {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("La variable d'environnement AZURE_STORAGE_CONNECTION_STRING est absente.");
  }

  if (!AZURE_STORAGE_CONTAINER_NAME) {
    throw new Error("La variable d'environnement AZURE_STORAGE_CONTAINER_NAME est absente.");
  }

  return {
    connectionString: AZURE_STORAGE_CONNECTION_STRING,
    containerName: AZURE_STORAGE_CONTAINER_NAME,
  };
}

async function getContainerClient() {
  if (cachedContainerClient) {
    return cachedContainerClient;
  }

  if (!cachedContainerReadyPromise) {
    cachedContainerReadyPromise = (async () => {
      const { connectionString, containerName } = getStorageConfig();
      const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = serviceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();
      cachedContainerClient = containerClient;
      return containerClient;
    })().catch((error) => {
      cachedContainerReadyPromise = null;
      throw error;
    });
  }

  return cachedContainerReadyPromise;
}

export function sanitizeBlobSegment(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "visuel";
}

export async function uploadBufferToBlobStorage(params: {
  buffer: Buffer;
  blobName: string;
  contentType: string;
}) {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(params.blobName);

  await blockBlobClient.uploadData(params.buffer, {
    blobHTTPHeaders: {
      blobContentType: params.contentType,
    },
  });

  return blockBlobClient.url;
}
