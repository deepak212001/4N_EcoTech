import {api} from "./client";

async function loginRequest(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data?.data;
}

async function registerRequest(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data?.data;
}

export {loginRequest, registerRequest};
