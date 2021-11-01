import crypto from "crypto";
import { ReadStream } from "fs";
import { AsyncSet } from "./utils/AsyncSet";

function checksum(
  str: string,
  algorithm?: string,
  encoding?: crypto.HexBase64Latin1Encoding
) {
  return crypto
    .createHash(algorithm || "sha256")
    .update(str, "utf8")
    .digest(encoding || "hex");
}

export async function fingerprint(document: Document) {
  const chunks = [];
  for await (let chunk of document) {
    chunks.push(chunk);
  }
  const docString = Buffer.concat(chunks).toString("utf8");
  return checksum(docString);
}

type Hash = string;
type Document = ReadStream;
/** Fingerprints a document so that the same document won't be indexed twice. Chapter 20 (pg.446) of IR book*/
export class DocumentFingerPrinterFullHash {
  #set: AsyncSet<Hash> = new AsyncSet();

  /** Checks whether the document already exists in storage.
   *
   */
  async has(document: Document | string) {
    if (typeof document === "string") {
      return this.#set.has(checksum(document));
    } else {
      return this.#set.has(await fingerprint(document));
    }
  }

  /** Adds the document fingerprint to some storage mechanism */
  async add(document: Document): Promise<void> {
    if (typeof document === "string") {
      await this.#set.add(checksum(document));
    } else {
      await this.#set.add(await fingerprint(document));
    }
  }
}

export class NoDocumentFingerPrinter {
  #set = null;

  /** Checks whether the document already exists in storage.
   *
   */
  async has(_document: Document | string) {
    return false;
  }

  /** Adds the document fingerprint to some storage mechanism */
  async add(_document: Document): Promise<void> {}
}
