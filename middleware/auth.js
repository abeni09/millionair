// middleware/auth.js

export default function ({ store, redirect }) {
    // Check if user is not logged in
    if (!store.state.auth.loggedIn) {
      return redirect('/login') // Redirect to login page
    }
  }
  