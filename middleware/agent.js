// middleware/admin.js

export default function ({ store, redirect }) {
    const user = store.state.auth.user; // Assuming you have a Vuex store with user information
  
    // Check if the user is authenticated
    if (user == null || user.role == null || (user.role != 'Admin' && user.role != 'Agent')) {
      // console.log(user.role);
      return redirect('/members'); // Redirect unauthenticated users to the default
    }
  }
  