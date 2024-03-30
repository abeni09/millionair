<template >

  <v-card class="px-10 py-3 ">
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
      <v-form>
          <v-text-field
          prepend-icon="mdi-rename-box"
              outlined
              dense
              :disabled="loading==true"
              ref="site_name"
              required
              v-model="editedItem.site_name"
              hint="Enter the name of the company"
              label="Site Name"/>
          <v-text-field
          prepend-icon="mdi-pot"
              outlined
              dense
              :disabled="loading==true"
              ref="batch_amount"
              required
            type="number"
              v-model="editedItem.batch_amount"
              label="Enter the number of batch"
              hint="Simultaneous number of batch to start with"/>
          <v-text-field
          prepend-icon="mdi-timer-sand"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="member_spin_timeout"
              required
              v-model="editedItem.member_spin_timeout"
              hint="Enter the maximum amount of seconds given for a member to spin"
              label="Member Spin Timeout"/>
          <v-text-field
          prepend-icon="mdi-timer-sand"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="draw_timeout"
              required
              v-model="editedItem.draw_timeout"
              hint="Enter the maximum amount of minuted to wait for the draw to end processing"
              label="Draw Timeout"/>
          <v-text-field
          prepend-icon="mdi-cash"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="deposit_contribution_before"
              required
              v-model="editedItem.deposit_contribution_before"
              hint="Enter the amount of money a single member will contribue BEFORE winning"
              label="Pre - Daily Contribution"/>
          <v-text-field
          prepend-icon="mdi-cash"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="service_fee"
              required
              v-model="editedItem.service_fee"
              hint="Enter the amount of money paid as a service fee"
              label="Service Fee"/>
          <v-text-field
          prepend-icon="mdi-view-day"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="min_deposit_days"
              required
              v-model="editedItem.min_deposit_days"
              hint="Enter the minimum number of deposit days to process"
              label="Minimum deposit days"/>
          <v-text-field
          prepend-icon="mdi-cash-100"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="deposit_contribution_after"
              required
              v-model="editedItem.deposit_contribution_after"
              hint="Enter the amount of money a single member will contribue AFTER winning"
              label="Post - Daily Contribution"/>
          <v-text-field
          prepend-icon="mdi-view-day"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="max_deposit_days"
              required
              v-model="editedItem.max_deposit_days"
              hint="Enter the maximum number of deposit days to process"
              label="Maximum deposit days"/>
          <v-text-field
          prepend-icon="mdi-account-multiple"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="daily_number_of_winners"
              required
              v-model="editedItem.daily_number_of_winners"
              hint="Enter the amount of members that will win in a single day"
              label="Daily number of winners"/>
          <v-text-field
          prepend-icon="mdi-cash-multiple"
                  outlined
                  dense
              :disabled="loading==true"
              ref="daily_win_amount"
              type='number'
              v-model="editedItem.daily_win_amount"
              required
              hint="Enter the amount of money a single member will win"
              label="Daily winning amount"/>
          <v-text-field
          prepend-icon="mdi-calendar-blank"
                  outlined
                  dense
              :disabled="loading==true"
              ref="max_days_to_wait"
              type='number'
              v-model="editedItem.max_days_to_wait"
              required
              hint="Enter the maximum number of days to wait for a member to deposit before disallowing any further deposits"
              label="Maximum days to wait"/>
          <v-text-field
          prepend-icon="mdi-calendar-today"
                  outlined
                  dense
              :disabled="loading==true"
              ref="max_days_to_penalize"
              type='number'
              v-model="editedItem.max_days_to_penalize"
              required
              hint="Enter the maximum number of days to wait for a member that has won to be penalized"
              label="Maximum days to penalize"/>
          <v-text-field
          prepend-icon="mdi-cash-multiple"
                  outlined
                  dense
              :disabled="loading==true"
              ref="penality_fee"
              type='number'
              v-model="editedItem.penality_fee"
              required
              hint="Enter the amount of money a member that has won will be penalized"
              label="Amount of penality money"/>
          <v-text-field
          prepend-icon="mdi-copyright"
                  outlined
                  dense
              :disabled="loading==true"
              ref="copy_right_content"
              
              v-model="editedItem.copy_right_content"
              required
              label="Copy right content"/>
          <v-text-field
          prepend-icon="mdi-web"
                  outlined
                  dense
              :disabled="loading==true"
              ref="server_url"
              
              v-model="editedItem.server_url"
              required
              label="Server URL"/>
          <v-text-field
          prepend-icon="mdi-number"
                  outlined
                  dense
              type='number'
              :disabled="loading==true"
              ref="maxmimum_members"
              
              v-model="editedItem.maxmimum_members"
              required
              label="Maxmimu Members Per Batch"/>
          <v-text-field
          prepend-icon="mdi-number"
                  outlined
                  dense
              :disabled="loading==true"
              ref="about_us"
              
              v-model="editedItem.about_us"
              required
              label="About Us"/>
          
        <v-card outlined v-if="editedItem.image_url">
            <v-img width="20%" height="30%" :src = "getImageUrl" />
        </v-card>
        <v-card :disabled = "loading">
            <ImageUpload label="Logo" :uploadUrl="editedItem.server_url" imageName="Logo"/>
        </v-card>
      
    </v-form>
              <div class="mt-5">
                <VBtn style="background-color: #183D0E; color: #FFC72C;" 
              :disabled="loading==true || editedItem.drawstarted" v-if="!saving"
               @click="save" block min-height="44" class="gradient">
                  Save
                </VBtn>
                <v-progress-circular v-if="saving || starping" style="width: 100%; margin: auto; color: #183D0E; " align = "center" indeterminate/>
                                
                <v-spacer/>
                <!-- <VBtn :disabled = "checkDate(editedItem.drawstartedat,'start')"  class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-if="!editedItem.drawstarted && !starping" -->
                <VBtn class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-if="!editedItem.drawstarted && !starping" :disabled="depositing"
               @click="startDraw" block min-height="44">
                  Start Draw
                </VBtn>
                <!-- <VBtn :disabled = "checkDate(editedItem.drawendedat, 'stop')"  class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-else-if="editedItem.drawstarted && !starping" :disabled="depositing" -->
                <VBtn class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-else-if="editedItem.drawstarted && !starping" :disabled="depositing"
               @click="startDraw" block min-height="44">
                  Emergency Stop
                </VBtn>
                <!-- <VBtn :disabled = "checkDate(editedItem.drawendedat, 'stop')"  class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-else-if="editedItem.drawstarted && !starping" -->
                <!-- <VBtn class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" :disabled="depositing"
               @click="startSimulation" block min-height="44">
                  Start Simulation
                </VBtn> -->
              </div>
  </v-card>


</template>

<script>
// import databaseAccess from '../middleware/databaseAccess'

import axios from 'axios';
import { format } from 'date-fns';
import jwt from 'jsonwebtoken';
import ImageUpload from '~/components/ImageUpload.vue';

// import Dropzone from 'nuxt-dropzone'
// import 'nuxt-dropzone/dropzone.css'
// let uuid = require('uuid')

export default {
    middleware:'admin',
    
    computed: {
        getImageUrl() {
            // Construct the image URL using 'editedItem.server_url' and 'editedItem.image_url'
            return `${this.editedItem.server_url}/uploads/Logo/${this.editedItem.image_url}`;
            // return `http://localhost:3006/uploads/Logo/${this.editedItem.image_url}`;
        }
    },
  components: {
    ImageUpload
  },
//   watch:{
//     editedItem.drawstarted(){
        
//     }
//   },
  mounted(){
    // this.token = localStorage.getItem('token');
    const settingToken = localStorage.getItem('settings');
    this.editedItem = JSON.parse(settingToken)
    this.editedItem.drawstarted = JSON.parse(settingToken).drawstarted
    this.fetchSiteSettings()
},
  methods:{
    
    handleSnackbarEvent(payload) {
      // Call your setSnackbarMessage function here
      this.setSnackbarMessage(payload.snackBarText);
    },
    
    async fetchSiteSettings(){
            this.loading = true;
            try {
                // const response = await fetch(`http://78.46.175.135:3006/fetchSiteSettings`, {
                const response = await fetch(`${this.editedItem.server_url}/fetchSiteSettings`, {
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
                if (data.settings != null) {
                    this.editedItem = data.settings;
                    localStorage.setItem('settings', JSON.stringify(data.settings))
                }
                // console.log(data);
                
                
            } catch (error) {
                console.error('Error fetching members:', error);
                this.setSnackbarMessage(error)
                // return false
                
            }
            this.loading = false;
        },
    checkDate(date, start){
        if (start == 'start' && date != null) {
            return this.formatDate(date).toString() == this.formatDate(Date.now()).toString()    
        }
        else if(start == 'stop' && date != null){
            return this.formatDate(date).toString() == this.formatDate(Date.now()).toString()
        }
        else{
            return false
        }
    },
    
    formatDate(timestamp) {
          return format(new Date(timestamp), 'MMM dd, yyyy');
          // return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
      },
        deleteProPic() {
            this.proPicisDeleting = true
            firebase.storage().refFromURL(this.editedItem.image_url).delete()
                .then(() => {
                        this.editedItem.image_url = '',
                        this.proPicProgress = null,
                        this.proPicisDeleting = false
                })
                .catch((error) => {
                    this.proPicisDeleting = false
                    console.error('Error deleting image', error)
                })
        },
        launchProPicFile() {
            this.$refs.proPicFile.click()
        },
        async uploadProPicFile(files) {
            if (!files.length) {
                return
            }
            const file = files[0]

            if (!file.type.match('image.*')) {
                alert('Please upload an image.')
                return
            }

            const metadata = {
                contentType: file.type
            }

            this.proPicisUploading = true
            this.proPicUploadStarted = true
            const formData = new FormData();
            formData.append('image', file); // 'file' is the selected image file
            await fetch(`${this.editedItem.server_url}/upload`, {
            // await fetch(`http://localhost:3006/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    //'Authorization': `Bearer ${this.token}`
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                this.editedItem.image_url = data.imageUrl;
                // Use the imageUrl to display the uploaded image or store it in your database
            })
            .catch(error => console.error('Error uploading image:', error));


            this.proPicisUploading = false
        },
        pauseProPicUpload() {
            if (this.proPicUploadTask != null) {
                this.proPicUploadTask.pause()
                this.proPicpaused = true
                this.proPiccancelled = false
                this.proPicresumed = false
            }
        },
        resumeProPicUpload() {
            if (this.proPicUploadTask != null) {
                this.proPicUploadTask.resume()
                this.proPiccancelled = false
                this.proPicresumed = true
                this.proPicpaused = false
            }
        },
        cancelProPicUpload() {
            if (this.proPicUploadTask != null) {
                this.proPicUploadTask.cancel()
                this.proPiccancelled = true
                this.proPicpaused = false
                this.proPicisUploading = false
                this.proPicuploadStarted = false
                this.proPicresumed = true
            }
        },
        setSnackbarMessage(_value){
            this.snackbar = true;
            this.snackBarText = _value
        },  
        async save() {
            this.saving = true;
            // this.editedItem.updated_at = Date.now();
            this.editedItem.updated_at = 'NOW()';
            // this.editedItem.drawstarted = false;
            try {
                const response = await fetch(`${this.editedItem.server_url}/updateSiteSettings`, {
                // const response = await fetch(`http://localhost:3006/updateSiteSettings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        //'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({userId: this.currentUser.userId, updatedData: this.editedItem}),
                })
                if (!response.ok) {
                        const finalResponse = await response.json()
                        console.log(finalResponse);
                        throw new Error(finalResponse.message);
                }

                const data = await response.json();
                this.setSnackbarMessage(data.message)
                this.saving = false
                // console.log(data);
                
                
            } catch (error) {
                this.saving = false
                console.error('Error updating settings:', error);
                this.setSnackbarMessage(error)
                
            }
        },

        async startDraw() {
            this.starping = true
            try {
                const response = await fetch(`${this.editedItem.server_url}/startDraw`, {
                // const response = await fetch(`http://localhost:3006/startDraw`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        //'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({drawstarted: !this.editedItem.drawstarted}),
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                localStorage.setItem('settings', JSON.stringify(data.setting))
                this.editedItem.drawstarted = data.setting.drawstarted
                this.setSnackbarMessage(data.message)
                this.starping = false
                console.log(data.setting);
                
                
            } catch (error) {
                this.starping = false
                console.error('Error starting draw:', error);
                this.setSnackbarMessage(error)
                
            }

        },
        async startSimulation() {
            this.depositing = true
            try {
                const response = await fetch(`${this.editedItem.server_url}/calculate-days`, {
                // const response = await fetch(`http://localhost:3007/calculate-days`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        //'Authorization': `Bearer ${this.token}`
                    },
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.setSnackbarMessage(data.message)
                this.depositing = false
                // console.log(data);
                
                
            } catch (error) {
                this.depositing = false
                console.error('Error starting draw:', error);
                this.setSnackbarMessage(error)
                
            }

        },

  },

 data: () => ({
    token: null,
    userHasPermission: false,
    // server_url: null,
    snackBarText:'',
    timeout: 2000,
    snackbar:false,
    saving : false,
    starping : false,
    depositing : false,
    lottoNumbersgenerated : false,
    lottoNumbersgenerating : false,
  
    proPicImageType: null,
    
    proPicProgress: null,
    // editedItem.image_url: '',
    proPicpaused: false,
    proPicresumed: true,
    proPiccancelled: false,
    proPicisUploading: false,
    proPicisDeleting: false,
    isProPicDeleting: false,
    proPicUploadStarted: false,
    proPicUploadTask: null,
    userIsAdmin:false,
     dropzoneOptions:{
         url:'https://httpbin.org/post',
         thumbnailWidth:250,
         thumbnailHeight:250,
         addremoveLinks:false,
         acceptedFiles: '.jpeg, .png, .jpg'
     },
     images:[],
     picture: null,
     loading : true,
     uploadValue: 0,
     settings: [],

    editedItem: {
        maxmimum_members: null,
        systemstartedat: null,
        drawstarted: false,
        drawendedat: null,
        drawstartedat: null,
        site_name: null,
        batch_amount: null,
        member_spin_timeout: null,
        draw_timeout: null,
        service_fee: null,
        deposit_contribution_before: null,
        min_deposit_days: null,
        max_deposit_days: null,
        penality_fee: null,
        max_days_to_wait: null,
        max_days_to_penalize: null,
        deposit_contribution_after: null,
        daily_number_of_winners: null,
        daily_win_amount: null,
        copy_right_content: null,
        server_url: null,
        about_us:null,
        image_url:null,
        updated_at:null,
        updated_by: 1,
    }
}),


}
</script>

<style>

</style>