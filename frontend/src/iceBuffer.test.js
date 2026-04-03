import { describe, expect, it, vi } from "vitest";
import { addIceWhenReady, flushIceBuffer } from "./iceBuffer.js";

describe("iceBuffer", () => {
  it("đưa vào buffer khi chưa có remoteDescription", async () => {
    const buf = [];
    const pc = { remoteDescription: null, addIceCandidate: vi.fn() };
    await addIceWhenReady(pc, { candidate: "x" }, buf);
    expect(buf).toHaveLength(1);
    expect(pc.addIceCandidate).not.toHaveBeenCalled();
  });

  it("flush gọi addIceCandidate", async () => {
    const buf = [{ candidate: "a" }];
    const pc = { remoteDescription: {}, addIceCandidate: vi.fn().mockResolvedValue(undefined) };
    await flushIceBuffer(pc, buf);
    expect(pc.addIceCandidate).toHaveBeenCalledWith({ candidate: "a" });
    expect(buf).toHaveLength(0);
  });
});
