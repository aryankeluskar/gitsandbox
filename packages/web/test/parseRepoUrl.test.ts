import { describe, it, expect } from "vitest";
import { parseRepoUrl, InvalidRepoUrlError } from "../src/lib/parseRepoUrl";

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

  it("throws on invalid input", () => {
    expect(() => parseRepoUrl("not-a-url")).toThrow(InvalidRepoUrlError);
  });

  it("handles URL with trailing slash", () => {
    expect(parseRepoUrl("https://github.com/owner/repo/")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles URL without protocol", () => {
    expect(parseRepoUrl("github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles URL with .git suffix", () => {
    expect(parseRepoUrl("https://github.com/owner/repo.git")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("trims whitespace", () => {
    expect(parseRepoUrl("  owner/repo  ")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles dotted names", () => {
    expect(parseRepoUrl("my-org/my.project")).toEqual({
      owner: "my-org",
      repo: "my.project",
      branch: "main",
    });
  });
});
