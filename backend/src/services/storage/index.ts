import { env } from "../../config/env";
import { LocalStorageDriver } from "./localStorageDriver";
import { S3StorageDriver } from "./s3StorageDriver";
import type { StorageDriver } from "./storageDriver";

let driver: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (!driver) {
    driver = env.storageDriver === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  }
  return driver;
}

export type { StorageDriver, StoredFile } from "./storageDriver";
