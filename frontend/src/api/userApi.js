import axiosInstance from './axiosInstance';

export const userApi = {
  getUsers: async () => {
    const response = await axiosInstance.get('/users');
    return response.data;
  }
};

export default userApi;
