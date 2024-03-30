// store/auth.js

export const state = () => ({
    loggedIn: false, // Initially, the user is not logged in
    user: null, // Store user information when logged in
    // token: null // Store token information when logged in
  })
  
  export const mutations = {
    // setToken(state, token){
    //   state.token = token
    // },
    login(state, user) {
      state.loggedIn = true
      state.user = user
    },
    logout(state) {
      state.loggedIn = false
      state.user = null
      this.$cookies.remove('token')
      // state.token = null
    }
  }
  
  export const actions = {
    // setToken({ commit }, token) {
    //   // Upon successful login, commit the login mutation to update the state
    //   commit('login', token)
    //   console.log(token);
    // },
    login({ commit }, user) {
      // Upon successful login, commit the login mutation to update the state
      commit('login', user)
      console.log(user);
    },
    logout({ commit }) {
      // Upon successful logout, commit the logout mutation to update the state
      commit('logout')
    }
  }
  