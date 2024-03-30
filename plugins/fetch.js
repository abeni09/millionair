// plugins/fetch.js

export default function ({ app }) {
    if (process.client) {
      const originalFetch = window.fetch;
  
      window.fetch = function (url, options = {}) {
        // Define an array of paths to exclude from intercepting
        const excludedPaths = ['/loginStaff']; // Add paths to exclude here
  
        // Check if the requested URL matches any of the excluded paths
        if (excludedPaths.some(path => url.includes(path))) {
          // If the URL matches an excluded path, do not intercept the request
          return originalFetch(url, options);
        }
  
        const token = app.$cookies.get('token'); // Retrieve the JWT token from cookies
  
        if (token) {
          options.headers = options.headers || {};
          options.headers['Authorization'] = `${token}`; // Attach the token to the Authorization header
        }
  
        return originalFetch(url, options);
      }
    }
  }
  