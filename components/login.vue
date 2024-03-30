<template>
  <VContainer fluid class="fill-height">
    <VRow no-gutters align="center" justify="center" class="fill-height">
      <VCol cols="8" md="8" lg="8" sm="8">
        <VRow no-gutters align="center" justify="center">
          <VCol cols="12" md="6">
            <h1 align="center">Log in</h1>
            <p align="center" class="text-medium-emphasis">
              Enter your details to get started
            </p>

            <VForm ref="loginForm" v-model="valid" lazy-validation class="mt-7">
              <div class="mt-1">
                <VTextField
                outlined
                
                  :disabled="loading"
                  v-model="loginPhone"
                  :rules="loginPhoneRules"
                  prepend-icon="mdi-phone-outline"
                  label="Phone"
                  id="phone"
                  name="phone"
                  type="number"
                />
              </div>
              <!-- Show password input only in login mode -->
              <div class="mt-1">
                <!-- <label class="label text-grey-darken-2" for="password">Password</label> -->
                <VTextField
                outlined
                
                  :disabled="loading"
                  v-model="loginPassword"
                  :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                  :rules="[rules.required, rules.min]"
                  :type="show1 ? 'text' : 'password'"
                  label="Password"
                  prepend-icon="mdi-lock-outline"
                  hint="At least 8 characters"
                  counter
                  @click:append="show1 = !show1"
                  id="password"
                  name="password"
                />
              </div>
              <div v-if="confirmPasswordVisible" class="mt-1">
                <!-- <label class="label text-grey-darken-2" for="confirmPassword">Confirm Password</label> -->
                <VTextField
                outlined
                
                  v-model="confirmPassword"
                  :append-icon="showConfirm ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showConfirm ? 'text' : 'password'"
                  label="Confirm Password"
                  prepend-icon="mdi-lock-outline"
                  hint="At least 8 characters"
                  counter
                  @click:append="showConfirm = !showConfirm"
                  id="confirmPassword"
                  name="confirmPassword"
                />
              </div>
              <div class="mt-5">
                <VBtn style="background-color: #183D0E; color: #FFC72C;" v-if="!loading" :disabled="!valid"  @click="validate" block min-height="44" class="gradient">
                  Sign In
                </VBtn>
                <v-progress-circular style="width: 100%; margin: auto; color: #183D0E; " align = "center" v-if="loading" indeterminate/>
              </div>
            </VForm>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
    <v-snackbar
      v-model="snackbar"
      :timeout="timeout"  
    >
      {{ snackBarText }}

      <template v-slot:actions>
        <v-btn
          color="pink"
          variant="text"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </VContainer>
</template>

  <script>
  import { mapActions } from 'vuex'
  
  export default {
    
    data() {
      return {
        server_url:null,
        snackBarText:'',
        timeout: 2000,
        snackbar:false,
        confirmPasswordVisible: false,
        userAvailable: false,
        loading: false,
        dialog: true,
        tab: 0,
        tabs: [
          { name: "Login", icon: "mdi-account" },
        ],
        show1: false,
        valid: true,
        loginPassword: "",
        confirmPassword: null,
        loginPhone: "",
        loginEmailRules: [
          v => !!v || "Required",
          v => /.+@.+\..+/.test(v) || "E-mail must be valid",
        ],
        loginPhoneRules: [
          v => !!v || "Required",
          v => (v && /^\d+$/.test(v)) || "Phone number must contain only digits",
          v => (v && (v.length == 9)) || "Phone number must be 9 digits",
        ],
        rules: {
          required: value => !!value || "*Required.",
          min: v => (v && v.length >= 8) || "Min 8 characters",
        },
      };
    },
    methods: {
      
      ...mapActions('auth', ['login']), // Map the 'login' action from the 'auth' module

      setSnackbarMessage(_value){
        this.snackbar = true;
        this.snackBarText = _value
      },
      
      // async fetchSiteSettings(){
      //   this.loading = true;
      //   try {
      //       const response = await fetch(`http://localhost:3006/fetchSiteSettings`, {
      //       // const response = await fetch(`${this.siteSettingsValues.server_url}/generate-users`, {
      //           method: 'GET',
      //           headers: {
      //               'Content-Type': 'application/json',
      //           },
      //       })
      //       // if (response.status == 100) {
                
      //       // }
      //       if (!response.ok) {
      //           throw new Error(`HTTP error! Status: ${response.status}`);
      //       }

      //       const data = await response.json();
      //       console.log(data.settings);
      //       if (data.settings != null) {
      //           this.server_url = data.settings.server_url;
                
      //       }
      //       // console.log(data);
            
            
      //   } catch (error) {
      //       console.error('Error fetching members:', error);
      //       this.setSnackbarMessage(error)
      //       // return false
            
      //   }
      //   this.loading = false;
      // },
      async validate() {
        if (this.$refs.loginForm.validate()) {
          if (this.confirmPasswordVisible) {
            // Check if the passwords match
            if (this.loginPassword !== this.confirmPassword) {
              // this.setSnackbarMessage("Passwords do not match");
              this.setSnackbarMessage("Passwords do not match")
              return;
            }
          }
          this.loading = true;
  
          try {
            const response = await fetch('http://78.46.175.135:3006/loginStaff', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone: this.loginPhone,
                password: this.loginPassword,
                confirm: this.confirmPasswordVisible
              })
            });
            // const finalResponse = await response.json();
            const data = await response.json();
            console.log(data)

            if (!response.ok) {
              throw new Error(data.message);
            } else {
              // Dispatch 'login' action with user data
              if (data.confirm) {
                this.confirmPasswordVisible = true
              } else {
                // After receiving the token from the server response
                // this.$cookies.set('token', data.token);
                this.$cookies.set('token', data.token, {path:'/', maxAge: 60 * 60 * 24})
                this.$store.dispatch('auth/login', data.data);
                // this.$store.dispatch('auth/setToken', data.token)
                // this.$router.go()
              }
            }

            this.setSnackbarMessage(data.message);
          } catch (error) {
            console.error(`Error loging in: ${error}`);
            this.setSnackbarMessage(error);
          } finally {
            this.loading = false;
          }
        }
      },
    },
  };
  </script>
  