import axiosInstance from './axiosInstance';

export const ticketApi = {
  getTickets: async (params = {}) => {
    const response = await axiosInstance.get('/tickets', { params });
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await axiosInstance.get(`/tickets/${id}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await axiosInstance.post('/tickets', ticketData);
    return response.data;
  },

  updateTicket: async (id, updateData) => {
    const response = await axiosInstance.put(`/tickets/${id}`, updateData);
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await axiosInstance.delete(`/tickets/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await axiosInstance.get('/tickets/stats');
    return response.data;
  }
};

export default ticketApi;
