import axiosInstance from './axiosInstance';

export const commentApi = {
  getComments: async (ticketId) => {
    const response = await axiosInstance.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  addComment: async (ticketId, comment) => {
    const response = await axiosInstance.post(`/tickets/${ticketId}/comments`, { comment });
    return response.data;
  }
};

export default commentApi;
