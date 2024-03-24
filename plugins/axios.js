// plugins/axios.js

import axios from 'axios';

export default ({ $axios }) => {
  // Set baseURL for all axios requests
  $axios.defaults.baseURL = process.env.API_BASE_URL || 'http://localhost:3006'; // Change the URL to match your backend API

  // Optional: Set default headers (e.g., authorization token)
  // $axios.defaults.headers.common['Authorization'] = 'Bearer token';
};
