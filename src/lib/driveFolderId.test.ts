import { describe, it, expect } from "vitest";
import { extractDriveFolderId } from "./driveFolderId";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz_-12";

describe("extractDriveFolderId", () => {
  it("reads a folders share link", () => {
    expect(extractDriveFolderId(`https://drive.google.com/drive/folders/${ID}?usp=sharing`)).toBe(ID);
  });
  it("reads an account-scoped link", () => {
    expect(extractDriveFolderId(`https://drive.google.com/drive/u/0/folders/${ID}`)).toBe(ID);
  });
  it("reads open?id= links", () => {
    expect(extractDriveFolderId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
  });
  it("accepts a raw ID", () => {
    expect(extractDriveFolderId(`  ${ID} `)).toBe(ID);
  });
  it("rejects other sites and junk", () => {
    expect(extractDriveFolderId(`https://evil.com/drive/folders/${ID}`)).toBeNull();
    expect(extractDriveFolderId("hello")).toBeNull();
    expect(extractDriveFolderId("")).toBeNull();
  });
});

import { parseDriveFolderLink } from "./driveFolderId";
describe("parseDriveFolderLink", () => {
  it("keeps the resource key of link-shared folders", () => {
    expect(parseDriveFolderLink(`https://drive.google.com/drive/folders/${ID}?resourcekey=0-abcDEF_1&usp=sharing`)).toEqual({ id: ID, resourceKey: "0-abcDEF_1" });
  });
  it("works without a resource key", () => {
    expect(parseDriveFolderLink(ID)).toEqual({ id: ID });
  });
});
