import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LiveHub from "./LiveHub.jsx";

describe("LiveHub", () => {
  it("hiển thị tiêu đề chính", () => {
    render(
      <BrowserRouter>
        <LiveHub />
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /bắt đầu trong vài bước/i })).toBeInTheDocument();
  });

  it("có nút tạo phòng phát", () => {
    render(
      <BrowserRouter>
        <LiveHub />
      </BrowserRouter>
    );
    expect(screen.getByRole("link", { name: /tạo phòng phát/i })).toHaveAttribute("href", "/host");
  });
});
