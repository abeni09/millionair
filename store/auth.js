// store/auth.js

export const state = () => ({
    loggedIn: false, // Initially, the user is not logged in
    user: null // Store user information when logged in
  })
  
  export const mutations = {
    login(state, user) {
      state.loggedIn = true
      state.user = user
    },
    logout(state) {
      state.loggedIn = false
      state.user = null
    }
  }
  
  export const actions = {
    login({ commit }, user) {
      // Perform login logic (e.g., authenticate user)
      // Upon successful login, commit the login mutation to update the state
      commit('login', user)
    },
    logout({ commit }) {
      // Perform logout logic (e.g., clear authentication tokens)
      // Upon successful logout, commit the logout mutation to update the state
      commit('logout')
    }
  }
  