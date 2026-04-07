import {api} from "./client";

async function listProviders() {
  const response = await api.get("/providers");
  return response.data?.data || [];
}

async function getProvider(id) {
  const response = await api.get(`/providers/${id}`);
  return response.data?.data;
}

async function bookAppointment(payload) {
  const response = await api.post("/appointments", payload);
  return response.data?.data;
}

async function getMyAppointments() {
  const response = await api.get("/appointments");
  return response.data?.data || [];
}

async function cancelAppointment(id) {
  const response = await api.delete(`/appointments/${id}`);
  return response.data?.data;
}

export {
  listProviders,
  getProvider,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
};
