// middleware/auth.js

import jwt from 'jsonwebtoken';

export default function ({ app, store, redirect }) {
  const token = app.$cookies.get('token'); // Retrieve the JWT token from cookies

  if (!token) {
    console.log('JWT token not found.');
    store.dispatch('auth/logout');
    return false;
  }

  const decodedToken = jwt.decode(token);
  if (!decodedToken) {
    console.log('Invalid JWT token.');
    store.dispatch('auth/logout');
    return false;
  }

  if (isTokenExpired(decodedToken)) {
    console.log('Token expired');
    store.dispatch('auth/logout');
    return false;
  }
  if (process.client) {
    localStorage.setItem('role', decodedToken.role)
  }
  // localStorage.setItem('role', decodedToken.role)

  console.log('Valid JWT token:', decodedToken.role);
  store.dispatch('auth/login', decodedToken);
}

function isTokenExpired(decodedToken) {
  // Implement your logic to check if the token is expired
  const expirationTime = decodedToken.exp * 1000; // Convert expiration time to milliseconds
  return Date.now() >= expirationTime;
}
