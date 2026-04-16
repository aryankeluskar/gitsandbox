import { describe, it, expect } from "vitest";
import { parseRepoUrl, InvalidRepoUrlError } from "../src/lib/parseRepoUrl";

describe("parseRepoUrl", () => {
  it("parses full GitHub URL", () => {
    expect(parseRepoUrl("https://github.com/owner/repo")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("parses GitHub URL with branch", () => {
    expect(parseRepoUrl("https://github.com/owner/repo/tree/dev")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "dev",
    });
  });

  it("parses shorthand owner/repo", () => {
    expect(parseRepoUrl("owner/repo")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("parses owner-only GitHub URL as account", () => {
    expect(parseRepoUrl("https://github.com/aryankeluskar")).toEqual({
      kind: "account",
      owner: "aryankeluskar",
    });
  });

  it("parses owner-only shorthand as account", () => {
    expect(parseRepoUrl("aryankeluskar")).toEqual({
      kind: "account",
      owner: "aryankeluskar",
    });
  });

  it("strips @ prefix from owner-only", () => {
    expect(parseRepoUrl("@vercel")).toEqual({
      kind: "account",
      owner: "vercel",
    });
  });

  it("throws on invalid input", () => {
    expect(() => parseRepoUrl("not a url with spaces")).toThrow(
      InvalidRepoUrlError
    );
  });

  it("handles URL with trailing slash", () => {
    expect(parseRepoUrl("https://github.com/owner/repo/")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles owner-only URL with trailing slash", () => {
    expect(parseRepoUrl("https://github.com/aryankeluskar/")).toEqual({
      kind: "account",
      owner: "aryankeluskar",
    });
  });

  it("handles URL without protocol", () => {
    expect(parseRepoUrl("github.com/owner/repo")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles URL with .git suffix", () => {
    expect(parseRepoUrl("https://github.com/owner/repo.git")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("trims whitespace", () => {
    expect(parseRepoUrl("  owner/repo  ")).toEqual({
      kind: "repo",
      owner: "owner",
      repo: "repo",
      branch: "main",
    });
  });

  it("handles dotted names", () => {
    expect(parseRepoUrl("my-org/my.project")).toEqual({
      kind: "repo",
      owner: "my-org",
      repo: "my.project",
      branch: "main",
    });
  });
});
