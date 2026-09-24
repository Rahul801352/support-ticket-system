import axiosInstance from './axiosInstance';

export const authApi = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await axiosInstance.post('/auth/register', { name, email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};

export default authApi;
