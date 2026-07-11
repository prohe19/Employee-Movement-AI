export interface StoredFile {
  /** Public or servable URL for the stored object. */
  url: string;
  /** Storage-internal key/path, used for later retrieval/deletion. */
  key: string;
}

export interface StorageDriver {
  save(input: { buffer: Buffer; key: string; contentType: string }): Promise<StoredFile>;
  load(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
