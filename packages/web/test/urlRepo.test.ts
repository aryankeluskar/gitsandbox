import { describe, it, expect } from "vitest";
import { extractRepoFromPath, buildGitHubUrl } from "../src/lib/urlRepo";

describe("extractRepoFromPath", () => {
  it("extracts owner/repo from simple path", () => {
    expect(extractRepoFromPath("/expressjs/express")).toEqual({
      owner: "expressjs",
      repo: "express",
      branch: "main",
    });
  });

  it("extracts owner/repo/tree/branch", () => {
    expect(extractRepoFromPath("/owner/repo/tree/dev")).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "dev",
    });
  });

  it("handles branch with slashes", () => {
    expect(
      extractRepoFromPath("/owner/repo/tree/feature/my-branch")
    ).toEqual({
      owner: "owner",
      repo: "repo",
      branch: "feature/my-branch",
    });
  });

  it("returns null for root path", () => {
    expect(extractRepoFromPath("/")).toBeNull();
  });

  it("returns null for single segment", () => {
    expect(extractRepoFromPath("/owner")).toBeNull();
  });

  it("returns null for invalid segments", () => {
    expect(extractRepoFromPath("/owner/repo name")).toBeNull();
  });
});

describe("buildGitHubUrl", () => {
  it("builds correct URL", () => {
    expect(buildGitHubUrl("expressjs", "express")).toBe(
      "https://github.com/expressjs/express"
    );
  });
});
