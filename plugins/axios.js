// plugins/axios.js

export default function ({ $axios, app }) {
  $axios.onRequest(config => {
    const token = app.$cookies.get('token'); // Retrieve the JWT token from cookies

    if (token) {
      config.headers.common['Authorization'] = `Bearer ${token}`; // Attach the token to the Authorization header
    }

    return config;
  });
}
