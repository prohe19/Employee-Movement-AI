import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env";
import type { StorageDriver, StoredFile } from "./storageDriver";

export class S3StorageDriver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    if (!env.s3.bucket) {
      throw new Error("S3_BUCKET must be set when STORAGE_DRIVER=s3");
    }
    this.bucket = env.s3.bucket;
    this.client = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint || undefined,
      forcePathStyle: env.s3.forcePathStyle,
      credentials:
        env.s3.accessKeyId && env.s3.secretAccessKey
          ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
          : undefined,
    });
  }

  async save(input: { buffer: Buffer; key: string; contentType: string }): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.contentType,
      })
    );
    const base = env.s3.endpoint
      ? `${env.s3.endpoint.replace(/\/$/, "")}/${this.bucket}`
      : `https://${this.bucket}.s3.${env.s3.region}.amazonaws.com`;
    return { url: `${base}/${input.key}`, key: input.key };
  }

  async load(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const body = result.Body;
    if (!body) throw new Error(`S3 object not found: ${key}`);
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
