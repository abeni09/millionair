<template>
  <div>
    <v-app v-if="currentUser" dark>
      
      <!-- <v-overlay v-if="loading">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-overlay> -->
      <v-navigation-drawer
        v-model="drawer"
        :mini-variant="miniVariant"
        :clipped="clipped"
        fixed
        app
      >
        <v-list>
          <v-slide-item>
          </v-slide-item>
          <v-list-item
          v-if="item.allow"
            v-for="(item, i) in items"
            :key="item.title"
            :to="item.to"
            router
            exact
          >
            <v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-text="item.title" />
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="currentUser">
            <v-list-item-action>
              <v-icon color="#183D0E">mdi-logout</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-btn @click="logout" color="#FFC72C">Logout</v-btn>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
      <v-app-bar :clipped-left="clipped" fixed app>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
        <!-- <v-btn icon @click.stop="miniVariant = !miniVariant">
          <v-icon>mdi-{{ `chevron-${miniVariant ? 'right' : 'left'}` }}</v-icon>
        </v-btn> -->
        <!-- <v-toolbar-title v-text="htitle" /> -->
        <v-spacer />
        
      <v-card-subtitle class="centered-title">
        Logged in as {{ currentUser.phone }}
      </v-card-subtitle>
        <div :dark="setTheme">
          <v-switch :label="`Dark`" v-model="goDark"></v-switch>
        </div>
      </v-app-bar>
      <v-main>
        <v-container>
          <Nuxt/>
        </v-container>
      </v-main>
      <v-footer :absolute="!fixed" app>
        <span>&copy; {{ new Date().getFullYear() +' '+ footerText}}</span>
      </v-footer>
    </v-app>
    <v-app v-else>
      <login/>
    </v-app>
  </div>
  </template>
  
  <script>
  
  import login from '../components/login.vue'
  import axios from 'axios';
  import jwt from 'jsonwebtoken';
  
  export default {
    head() {
      return {
        title: this.siteName    
        }
    },
    components:{
      login
    },
    name: 'DefaultLayout',
    data() {
      return {
        snackbar:false,
        snackBarText:'',
        token: null,
        primarycolor: '#183D0E',
        secondarycolor: '#FFC72C',
        siteName:'',
        footerText:'Meet Consultancy All Rights Reserved',
        // currentUser:null,
        goDark: false,
        userPermissions: [], // Store user permissions here
        clipped: false,
        drawer: true,
        fixed: false,
        // userHasPermission: false,
        // filteredMenuItems: [],
        items: [],
        imageURL:'',
        settings: [],
        headerTitle: '',
        miniVariant: false,
        right: true,
        rightDrawer: false,
        htitle: this.title,
        loading:true
      }
    },
    methods: {
      
      async fetchSiteSettings(){
        this.loading = true;
        try {
            const response = await fetch(`http://78.46.175.135:3006/fetchSiteSettings`, {
            // const response = await fetch(`${this.siteSettingsValues.server_url}/generate-users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    //'Authorization': `Bearer ${this.token}`
                },
            })
            // if (response.status == 100) {
                
            // }
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
            if (data.settings != null) {
              localStorage.setItem('serverURL', data.settings.server_url)
              localStorage.setItem('pots', data.settings.batch_amount)
              localStorage.setItem('settings', JSON.stringify(data.settings))
              // this.$router.go()
              // console.log(localStorage.getItem('pots'));
              // console.log(JSON.parse(localStorage.getItem('settings')).batch_amount);
            }
            
        } catch (error) {
            console.error('Error fetching site settings:', error);
            this.setSnackbarMessage(error)
            // return false
            
        }
        this.loading = false;
      },
      
      setSnackbarMessage(_value){
          this.snackbar = true;
          this.snackBarText = _value
      },
      logout() {
        // Remove the JWT token from cookies
        // this.$cookies.remove('token');
        localStorage.removeItem('token')
        this.token = null;
        this.$store.dispatch('auth/logout');
      },
      updateMenuItems() {
        this.items = [
          {
            icon: 'mdi-view-dashboard',
            title: 'Dashboard',
            to: '/',
            allow: true
          }, 
          {
            icon: 'mdi-run',
            title: 'Members',
            to: '/members',
            allow: true
          },
          {
            icon: 'mdi-cup',
            title: 'Winners',
            to: '/winners',
            allow: true
          },
          {
            icon: 'mdi-account-group',
            title: 'Users',
            to: '/users',
            allow: this.userHasPermission
          },
          {
            icon: 'mdi-memory',
            title: 'Settings',
            to: '/settings',
            allow: this.userHasPermission
          },
        ];
      // Reset the items array to trigger reactivity
        this.items.splice(0, this.items.length, ...this.items);
      },
      isTokenExpired(tokenData) {
        if (!tokenData || !tokenData.exp) {
          return true; // Token is missing expiration information, so consider it expired
        }

        // Convert expiration timestamp to milliseconds
        const expirationTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        console.log((expirationTime - currentTime)/60000);

        // Compare current time with expiration time
        return currentTime >= expirationTime;
      }
    },
    computed: {
      
      
      currentUser() {
        // Check if the user is logged in using Vuex store
        return this.$store.state.auth.user
        // this.updateMenuItems()
      },
      userHasPermission(){
        if (this.currentUser != null && this.currentUser.role === "Admin") {
          return true
        }
        return false
      },
      
      setTheme() {
          if (this.goDark == true) {
              return (this.$vuetify.theme.dark = true);
          } else {
              return (this.$vuetify.theme.dark = false);
          }
        },
      },
      watch: {
        userHasPermission() {
          // alert(newPermission)
          this.updateMenuItems();
        },
      },



    mounted(){
      this.updateMenuItems()
      this.fetchSiteSettings()
      // console.log(this.$cookies);
      
      // Access the JWT token from cookies or localStorage
      // const token = this.$cookies.get('token');
      const settingToken = localStorage.getItem('settings');
      this.footerText = JSON.parse(settingToken).copy_right_content
      
    },
  }
  </script>