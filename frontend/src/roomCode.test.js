import { describe, expect, it } from "vitest";
import { normalizeRoomCode } from "./roomCode.js";

describe("normalizeRoomCode", () => {
  it("chuẩn hóa giống backend", () => {
    expect(normalizeRoomCode("  XyZ9  ")).toBe("xyz9");
  });

  it("từ chối quá ngắn", () => {
    expect(normalizeRoomCode("abc")).toBe("");
  });
});
