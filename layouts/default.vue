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
        Logged in as {{ currentUser.email }}
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
    <v-app v-else-if="!currentUser">
      <login/>
    </v-app>
  </div>
  </template>
  
  <script>
  
  import firebase from 'firebase/compat/app'
  import 'firebase/compat/auth'
  import 'firebase/compat/storage'
  import login from '../components/login.vue'
  import axios from 'axios';
  
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
        primarycolor: '#183D0E',
        secondarycolor: '#FFC72C',
        siteName:'',
        footerText:'Meet Consultancy All Rights Reserved',
        currentUser:null,
        goDark: false,
        userPermissions: [], // Store user permissions here
        clipped: false,
        drawer: true,
        fixed: false,
        userHasPermission: false,
        // filteredMenuItems: [],
        items: [
          // {
          //   icon: 'mdi-view-dashboard',
          //   title: 'Dashboard',
          //   to: '/',
          //   allow: true
          // }, 
          // {
          //   icon: 'mdi-run',
          //   title: 'Members',
          //   to: '/Members',
          //   allow: true
          // },
          // {
          //   icon: 'mdi-numeric',
          //   title: 'Short Code',
          //   to: '/shortCodes',
          //   allow: true
          // }, 
          // {
          //   icon: 'mdi-check-bold',
          //   title: 'Results',
          //   to: '/results',
          //   allow: true
          // },
          // {
          //   icon: 'mdi-account-group',
          //   title: 'Users',
          //   to: '/users',
          //   allow: this.userHasPermission
          // },
          // {
          //   icon: 'mdi-memory',
          //   title: 'Settings',
          //   to: '/settings',
          //   allow: this.userHasPermission
          // },
        ],
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
      logout(){
        firebase.auth().signOut().then(
        )
        // window.location = '/login'
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
            to: '/Members',
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
      },
    },
    computed: {
      
      setTheme() {
          if (this.goDark == true) {
              return (this.$vuetify.theme.dark = true);
          } else {
              return (this.$vuetify.theme.dark = false);
          }
        },
      },
      watch: {
        userHasPermission(newPermission) {
          // alert(newPermission)
          this.updateMenuItems();
        },
      },


    mounted(){
      // alert('mounted')
      firebase.auth().onAuthStateChanged(user => {
          console.log(user)
          this.currentUser = user      
          if (this.currentUser) {
            const database = firebase.database();
            // alert(route.path)
            const currentUserEmail = this.currentUser.email;
            
            const sanitizedEmail = currentUserEmail.replace('@', '').replace('.', '');

            // Construct the path to the user in the "Users" database based on their UID
            const userPath = 'Users/' + sanitizedEmail;

            // Fetch the user permissions from the constructed path
            database.ref(userPath).on('value', (snapshot) => {
              const userPermissions = snapshot.val().role;
              // alert(userPermissions);
              if (userPermissions == "Admin") {
                this.userHasPermission = true;
              } else {
                this.userHasPermission = false;
              }
              this.updateMenuItems();
            });
          }
      })
    },
  }
  </script>