import client from "./client";

export const registerUser = (data) => client.post("/api/auth/register", data);
export const loginUser = (data) => client.post("/api/auth/login", data);
