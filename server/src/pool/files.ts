import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { createGunzip } from "node:zlib";
import type { FetchLike } from "../sources/http.js";

/**
 * IMDb's data files, read line by line as they arrive: fetched over HTTPS
 * and gunzipped on the fly, or read from a local folder (tests, offline
 * runs). Nothing is written to disk.
 */

export const IMDB_DATASETS = "https://datasets.imdbws.com";

/** The three files the pool is built from. */
export type DatasetName = "title.ratings" | "title.basics" | "title.crew";

/** Opens one file as its lines, header first. */
export type DatasetSource = (name: DatasetName) => Promise<AsyncIterable<string>>;

/**
 * A stream's lines, pulled a chunk at a time. `for await` over the stream
 * pulls, so a slow reader slows the download and the gunzip instead of
 * letting lines pile up in memory.
 */
async function* lines(stream: Readable): AsyncGenerator<string> {
  const decoder = new StringDecoder("utf8");
  let rest = "";
  for await (const chunk of stream) {
    const parts = (rest + decoder.write(chunk as Buffer)).split("\n");
    rest = parts.pop()!;
    for (const line of parts) yield line.endsWith("\r") ? line.slice(0, -1) : line;
  }
  rest += decoder.end();
  if (rest !== "") yield rest;
}

/** The files from IMDb's dataset host (or another base URL), gzipped. */
export function httpDatasets(fetch: FetchLike = globalThis.fetch, base = IMDB_DATASETS): DatasetSource {
  return async (name) => {
    const url = `${base}/${name}.tsv.gz`;
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error(`${url} answered ${response.status}`);
    const body = Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>);
    return lines(body.pipe(createGunzip()));
  };
}

/** The files from a local folder: `<name>.tsv.gz`, or `<name>.tsv` uncompressed. */
export function localDatasets(dir: string): DatasetSource {
  return async (name) => {
    const gz = join(dir, `${name}.tsv.gz`);
    if (existsSync(gz)) return lines(createReadStream(gz).pipe(createGunzip()));
    const plain = join(dir, `${name}.tsv`);
    if (!existsSync(plain)) throw new Error(`${name}.tsv(.gz) is not in ${dir}`);
    return lines(createReadStream(plain));
  };
}
