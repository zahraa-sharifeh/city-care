import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AdminAuthProvider } from "./context/AdminAuthContext";

test("renders admin sign in", () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { name: /municipal console/i })).toBeInTheDocument();
});
