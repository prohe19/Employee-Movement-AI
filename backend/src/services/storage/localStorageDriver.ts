import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import type { StorageDriver, StoredFile } from "./storageDriver";

export class LocalStorageDriver implements StorageDriver {
  private readonly rootDir: string;

  constructor(rootDir: string = env.localStorageDir) {
    this.rootDir = path.resolve(rootDir);
  }

  async save(input: { buffer: Buffer; key: string; contentType: string }): Promise<StoredFile> {
    const destPath = path.join(this.rootDir, input.key);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, input.buffer);
    const url = `${env.publicUploadsBaseUrl.replace(/\/$/, "")}/${input.key}`;
    return { url, key: input.key };
  }

  async load(key: string): Promise<Buffer> {
    const destPath = path.join(this.rootDir, key);
    return fs.readFile(destPath);
  }

  async delete(key: string): Promise<void> {
    const destPath = path.join(this.rootDir, key);
    await fs.rm(destPath, { force: true });
  }
}
