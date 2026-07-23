import axios from 'axios';

const apiClient = axios.create({ baseURL: 'http://localhost:1026/api/v1' });

apiClient.interceptors.request.use((config) => {
    let token = "test_token";
    if (token) {
      if (config.headers && typeof config.headers.has === 'function' && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
});

apiClient.post('/test', {}, {}).catch(e => console.log("Error:", e.message));
