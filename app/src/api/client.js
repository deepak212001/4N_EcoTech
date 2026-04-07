import axios from "axios";

const BASE_URL = "http://10.0.2.2:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let authToken = null;

function setAuthToken(token) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

function getErrorMessage(error) {
  return (
    error?.response?.data?.message || error?.message || "Something went wrong"
  );
}

export {api, setAuthToken, getErrorMessage, BASE_URL};
