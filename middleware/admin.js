// middleware/admin.js

export default function ({ store, redirect }) {
    const user = store.state.auth.user; // Assuming you have a Vuex store with user information
  
    // Check if the user is authenticated
    if (!user || !user.role || user.role !== 'Admin') {
        console.log(user);
      return redirect('/'); // Redirect unauthenticated users to the default
    }
  }
  