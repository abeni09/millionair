<template>
  <VContainer fluid class="fill-height">
    <VRow no-gutters align="center" justify="center" class="fill-height">
      <VCol cols="8" md="8" lg="8" sm="8">
        <VRow no-gutters align="center" justify="center">
          <VCol cols="12" md="6">
            <h1 align="center">{{ isResetPassword ? 'Reset password' : 'Log In' }}</h1>
            <p align="center" class="text-medium-emphasis">
              {{ isResetPassword ? 'Add your email to get instructions' : 'Enter your details to get started' }}
            </p>

            <VForm v-if="!isResetPassword" ref="loginForm" v-model="valid" lazy-validation class="mt-7">
              <div class="mt-1">
                <!-- <label class="label text-grey-darken-2" for="email">Email</label> -->
                <VTextField
                outlined
                
                  :disabled="loading"
                  v-model="loginEmail"
                  :rules="loginEmailRules"
                  prepend-icon="mdi-email-outline"
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
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
              <div v-if="!isResetPassword && confirmPasswordVisible" class="mt-1">
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
            <VForm v-if="isResetPassword" ref="resetForm" v-model="valid" lazy-validation class="mt-7">
              <div class="mt-1">
                <!-- <label class="label text-grey-darken-2" for="email">Email</label> -->
                <VTextField
                outlined
                
                  :disabled="loading"
                  v-model="loginEmail"
                  :rules="loginEmailRules"
                  prepend-icon="mdi-email-outline"
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
                />
              </div>
              <div class="mt-5">
                <VBtn style="background-color: #183D0E; color: #FFC72C;" v-if="!loading && isResetPassword" :disabled="!valid"  @click="validate" block min-height="44" class="gradient">
                  Send instructions
                </VBtn>
                <v-progress-circular style="width: 100%; margin: auto; color: #183D0E; " align = "center" v-if="loading" indeterminate/>
              </div>
            </VForm>
            <p class="text-body-2 mt-10">
              {{ isResetPassword
                ? 'Remember your password?'
                : 'Forgot your password?'
              }}
              <span
                @click="toggleResetPassword"
                class="font-weight-bold text-primary cursor-pointer"
              >
                {{ isResetPassword ? 'Sign In' : 'Reset Password' }}
              </span>
            </p>
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
  import firebase from "firebase/compat/app";
  import "firebase/compat/auth";
  import "firebase/compat/database";
  
  export default {
    
    data() {
      return {
        snackBarText:'',
        timeout: 2000,
        snackbar:false,
        isResetPassword: false,
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
        loginEmail: "",
        loginEmailRules: [
          v => !!v || "Required",
          v => /.+@.+\..+/.test(v) || "E-mail must be valid",
        ],
        rules: {
          required: value => !!value || "*Required.",
          min: v => (v && v.length >= 8) || "Min 8 characters",
        },
      };
    },
    computed: {
      sanitizedEmail() {
        return this.loginEmail.toLowerCase().replace('@', '').replace('.', '');
      },
    },
    methods: {
      toggleResetPassword(){
        this.isResetPassword = !this.isResetPassword;
      },
      setSnackbarMessage(_value){
        this.snackbar = true;
        this.snackBarText = _value
      },
      async validate() {
        if (this.isResetPassword) {
          if (this.$refs.resetForm.validate()) {
            this.loading = true;
            try {
              // Reset password logic using Firebase
              await firebase.auth().sendPasswordResetEmail(this.loginEmail);
              this.loading = false;
              this.setSnackbarMessage('Password reset instructions sent to your email.');
            } catch (error) {
              this.loading = false;
              this.setSnackbarMessage(error);
            }
          }
          
        }
        else{
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
              // Check if the email exists in the Users database
              const snapshot = await firebase
                .database()
                .ref(`Users/${this.sanitizedEmail}`)
                .once('value');
    
              if (snapshot.exists()) {
                // Attempt to sign in the user
                await firebase.auth().signInWithEmailAndPassword(
                  this.loginEmail,
                  this.loginPassword
                )
                // User is signed in
                this.loading = false;
                //console.log('User signed in');
              }
              else{
                  this.setSnackbarMessage("Invalid email or password")
                  this.confirmPasswordVisible = false
                  this.confirmPassword = ''
                  this.loading = false
              }
            } catch (error) {
              this.handleAuthenticationError(error);
            }
          }
        }
      },
      async handleUserNotFound() {
        // Attempt to create a new user
        firebase.auth().createUserWithEmailAndPassword(
          this.loginEmail,
          this.loginPassword
        ).catch((error) => {
          if (error.code === 'auth/email-already-in-use') {
            this.setSnackbarMessage("Invalid email or password")
            this.confirmPasswordVisible = false
          } else {
            this.setSnackbarMessage('Unable to create an account');
          }
          this.loading = false;
        });
      },
      handleAuthenticationError(error) {
        if (error.code === 'auth/invalid-login-credentials') {
          if(this.confirmPasswordVisible){
            this.handleUserNotFound()
          }
          else{
            this.openPasswordConfirmationDialog()
          }
          // this.handleUserNotFound();
        } else {
          this.setSnackbarMessage(error.code);
        }
        this.loading = false;
      },

      openPasswordConfirmationDialog() {
        this.confirmPasswordVisible = true;
        this.loading = false
      },

    },
  };
  </script>
  