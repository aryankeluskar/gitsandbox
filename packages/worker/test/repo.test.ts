import { describe, it, expect } from "vitest";
import { parseRepoUrl, buildTarballUrl, InvalidRepoUrlError } from "../src/repo";

describe("parseRepoUrl", () => {
  it("parses full GitHub URL", () => {
    expect(parseRepoUrl("https://github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("parses GitHub URL with branch", () => {
    expect(parseRepoUrl("https://github.com/owner/repo/tree/dev")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "dev",
    });
  });

  it("parses shorthand owner/repo", () => {
    expect(parseRepoUrl("owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("throws InvalidRepoUrlError on bad input", () => {
    expect(() => parseRepoUrl("not-a-url")).toThrow(InvalidRepoUrlError);
  });

  it("handles trailing slash", () => {
    expect(parseRepoUrl("https://github.com/a/b/")).toEqual({
      owner: "a",
      repo: "b",
      branch: "main",
    });
  });

  it("handles .git suffix", () => {
    expect(parseRepoUrl("https://github.com/a/b.git")).toEqual({
      owner: "a",
      repo: "b",
      branch: "main",
    });
  });
});

describe("buildTarballUrl", () => {
  it("builds public URL without token", () => {
    const url = buildTarballUrl(
      { owner: "expressjs", repo: "express", branch: "main" },
      false
    );
    expect(url).toBe(
      "https://github.com/expressjs/express/archive/refs/heads/main.tar.gz"
    );
  });

  it("builds API URL with token", () => {
    const url = buildTarballUrl(
      { owner: "expressjs", repo: "express", branch: "main" },
      true
    );
    expect(url).toBe(
      "https://api.github.com/repos/expressjs/express/tarball/main"
    );
  });
});
