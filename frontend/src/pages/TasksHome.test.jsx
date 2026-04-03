import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TASKS_STORAGE_KEY } from "../components/tasks/taskStorage.js";
import TasksHome from "./TasksHome.jsx";

describe("TasksHome", () => {
  beforeEach(() => {
    localStorage.removeItem(TASKS_STORAGE_KEY);
  });

  it("hiển thị tiêu đề danh sách công việc", () => {
    render(
      <BrowserRouter>
        <TasksHome />
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /danh sách công việc/i })).toBeInTheDocument();
  });

  it("có form thêm công việc", () => {
    render(
      <BrowserRouter>
        <TasksHome />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/tên/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thêm vào danh sách/i })).toBeInTheDocument();
  });
});
