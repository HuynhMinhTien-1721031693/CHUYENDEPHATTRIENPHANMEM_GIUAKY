const { createLiveRooms, normalizeRoomId } = require("../src/liveRooms");

function mockWs() {
  /** @type {unknown[]} */
  const out = [];
  const ws = {
    readyState: 1,
    __liveInfo: undefined,
    send(s) {
      out.push(JSON.parse(s));
    },
    close() {},
    messages: out,
  };
  return ws;
}

describe("normalizeRoomId", () => {
  it("chuẩn hóa chữ thường và trim", () => {
    expect(normalizeRoomId("  AbC12  ")).toBe("abc12");
  });

  it("từ chối quá ngắn / ký tự lạ", () => {
    expect(normalizeRoomId("abc")).toBe("");
    expect(normalizeRoomId("a@b!")).toBe("");
  });

  it("chấp nhận _ và -", () => {
    expect(normalizeRoomId("abcd_ef-g")).toBe("abcd_ef-g");
  });
});

describe("createLiveRooms", () => {
  it("host-start tạo phòng và room-ready", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    expect(host.messages[0].type).toBe("room-ready");
    expect(host.messages[0].roomId).toBeTruthy();
    expect(live.hasRoom(host.messages[0].roomId)).toBe(true);
  });

  it("viewer-join phòng không tồn tại → error", () => {
    const live = createLiveRooms();
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId: "khong-co" });
    expect(v.messages[0].type).toBe("error");
  });

  it("viewer-join mã không hợp lệ → error", () => {
    const live = createLiveRooms();
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId: "x@" });
    expect(v.messages[0].type).toBe("error");
  });

  it("viewer-join thành công → joined + host nhận viewer-joined", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const joined = v.messages.find((m) => m.type === "joined");
    expect(joined.viewerId).toBeTruthy();
    expect(host.messages.some((m) => m.type === "viewer-joined")).toBe(true);
  });

  it("relay offer từ host tới đúng viewer", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    const sdp = { type: "offer", sdp: "fake" };
    live.handleMessage(host, { type: "offer", viewerId, sdp });
    expect(v.messages.some((m) => m.type === "offer" && JSON.stringify(m.sdp) === JSON.stringify(sdp))).toBe(true);
  });

  it("relay answer từ viewer tới host", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    const ans = { type: "answer", sdp: "ans" };
    live.handleMessage(v, { type: "answer", sdp: ans });
    expect(
      host.messages.some(
        (m) =>
          m.type === "answer" &&
          m.viewerId === viewerId &&
          JSON.stringify(m.sdp) === JSON.stringify(ans)
      )
    ).toBe(true);
  });

  it("relay ice-host tới viewer", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    const candidate = { candidate: "c1" };
    live.handleMessage(host, { type: "ice-host", viewerId, candidate });
    expect(
      v.messages.some(
        (m) => m.type === "ice" && JSON.stringify(m.candidate) === JSON.stringify(candidate)
      )
    ).toBe(true);
  });

  it("viewer rời → host nhận viewer-left", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    live.handleClose(v);
    expect(host.messages.some((m) => m.type === "viewer-left" && m.viewerId === viewerId)).toBe(true);
  });

  it("giới hạn số viewer", () => {
    const live = createLiveRooms({ maxViewersPerRoom: 2 });
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    live.handleMessage(mockWs(), { type: "viewer-join", roomId });
    live.handleMessage(mockWs(), { type: "viewer-join", roomId });
    const v3 = mockWs();
    live.handleMessage(v3, { type: "viewer-join", roomId });
    expect(v3.messages[0].type).toBe("error");
  });

  it("host đóng → xóa phòng", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    live.handleClose(host);
    expect(live.hasRoom(roomId)).toBe(false);
  });

  it("viewerCount", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    expect(live.viewerCount(roomId)).toBe(0);
    live.handleMessage(mockWs(), { type: "viewer-join", roomId });
    expect(live.viewerCount(roomId)).toBe(1);
  });

  it("viewer giơ tay → host nhận raise-hand", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages.find((m) => m.type === "room-ready").roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    live.handleMessage(v, { type: "raise-hand", raised: true });
    expect(
      host.messages.some((m) => m.type === "raise-hand" && m.viewerId === viewerId && m.raised === true)
    ).toBe(true);
  });

  it("host cho phép media → viewer nhận media-allowed", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    live.handleMessage(host, { type: "host-allow-media", viewerId });
    expect(v.messages.some((m) => m.type === "media-allowed")).toBe(true);
  });

  it("relay media-reoffer từ viewer tới host", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    const sdp = { type: "offer", sdp: "renegotiate" };
    live.handleMessage(v, { type: "media-reoffer", sdp });
    expect(
      host.messages.some(
        (m) =>
          m.type === "media-reoffer" &&
          m.viewerId === viewerId &&
          JSON.stringify(m.sdp) === JSON.stringify(sdp)
      )
    ).toBe(true);
  });

  it("relay media-reanswer từ host tới viewer", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    const viewerId = v.messages.find((m) => m.type === "joined").viewerId;
    const sdp = { type: "answer", sdp: "re-ans" };
    live.handleMessage(host, { type: "media-reanswer", viewerId, sdp });
    expect(v.messages.some((m) => m.type === "media-reanswer" && JSON.stringify(m.sdp) === JSON.stringify(sdp))).toBe(
      true
    );
  });

  it("viewer like-toggle → nhận like-state và room-stats có likes", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages[0].roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    live.handleMessage(v, { type: "like-toggle" });
    expect(v.messages.some((m) => m.type === "like-state" && m.liked === true && m.likes === 1)).toBe(true);
    const stats = host.messages.filter((m) => m.type === "room-stats").pop();
    expect(stats.likes).toBe(1);
  });

  it("viewer gửi bình luận → cả phòng nhận và tăng commentCount", () => {
    const live = createLiveRooms();
    const host = mockWs();
    live.handleMessage(host, { type: "host-start" });
    const roomId = host.messages.find((m) => m.type === "room-ready").roomId;
    const v = mockWs();
    live.handleMessage(v, { type: "viewer-join", roomId });
    live.handleMessage(v, { type: "comment-add", text: "Xin chao" });
    expect(v.messages.some((m) => m.type === "room-comment" && m.text === "Xin chao")).toBe(true);
    expect(host.messages.some((m) => m.type === "room-comment" && m.text === "Xin chao")).toBe(true);
    expect(live.commentCount(roomId)).toBe(1);
  });
});
