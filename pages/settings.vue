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
              ref="sn"
              required
              v-model="editedItem.sn"
              hint="Enter the name of the company"
              label="Site Name"/>
          <v-text-field
          prepend-icon="mdi-pot"
              outlined
              dense
              :disabled="loading==true"
              ref="pot"
              required
            type="number"
              v-model="editedItem.pot"
              label="Enter the number of pots"
              hint="Simultaneous number of pots to start with"/>
          <v-text-field
          prepend-icon="mdi-timer-sand"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="mst"
              required
              v-model="editedItem.mst"
              hint="Enter the maximum amount of seconds given for a member to spin"
              label="Member Spin Timeout"/>
          <v-text-field
          prepend-icon="mdi-timer-sand"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="dt"
              required
              v-model="editedItem.dt"
              hint="Enter the maximum amount of minuted to wait for the draw to end processing"
              label="Draw Timeout"/>
          <v-text-field
          prepend-icon="mdi-cash"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="dcb"
              required
              v-model="editedItem.dcb"
              hint="Enter the amount of money a single member will contribue BEFORE winning"
              label="Pre - Daily Contribution"/>
          <v-text-field
          prepend-icon="mdi-cash"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="sf"
              required
              v-model="editedItem.sf"
              hint="Enter the amount of money paid as a service fee"
              label="Service Fee"/>
          <v-text-field
          prepend-icon="mdi-view-day"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="mindd"
              required
              v-model="editedItem.mindd"
              hint="Enter the minimum number of deposit days to process"
              label="Minimum deposit days"/>
          <v-text-field
          prepend-icon="mdi-cash-100"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="dca"
              required
              v-model="editedItem.dca"
              hint="Enter the amount of money a single member will contribue AFTER winning"
              label="Post - Daily Contribution"/>
          <v-text-field
          prepend-icon="mdi-view-day"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="maxdd"
              required
              v-model="editedItem.maxdd"
              hint="Enter the maximum number of deposit days to process"
              label="Maximum deposit days"/>
          <v-text-field
          prepend-icon="mdi-account-multiple"
              outlined
              dense
              :disabled="loading==true"
              type='number'
              ref="dnw"
              required
              v-model="editedItem.dnw"
              hint="Enter the amount of members that will win in a single day"
              label="Daily number of winners"/>
          <v-text-field
          prepend-icon="mdi-cash-multiple"
                  outlined
                  dense
              :disabled="loading==true"
              ref="dwa"
              type='number'
              v-model="editedItem.dwa"
              required
              hint="Enter the amount of money a single member will win"
              label="Daily winning amount"/>
          <v-text-field
          prepend-icon="mdi-calendar-blank"
                  outlined
                  dense
              :disabled="loading==true"
              ref="maxdw"
              type='number'
              v-model="editedItem.maxdw"
              required
              hint="Enter the maximum number of days to wait for a member to deposit before disallowing any further deposits"
              label="Maximum days to wait"/>
          <v-text-field
          prepend-icon="mdi-calendar-today"
                  outlined
                  dense
              :disabled="loading==true"
              ref="maxdp"
              type='number'
              v-model="editedItem.maxdp"
              required
              hint="Enter the maximum number of days to wait for a member that has won to be penalized"
              label="Maximum days to penalize"/>
          <v-text-field
          prepend-icon="mdi-cash-multiple"
                  outlined
                  dense
              :disabled="loading==true"
              ref="apm"
              type='number'
              v-model="editedItem.apm"
              required
              hint="Enter the amount of money a member that has won will be penalized"
              label="Amount of penality money"/>
          <v-text-field
          prepend-icon="mdi-copyright"
                  outlined
                  dense
              :disabled="loading==true"
              ref="crc"
              
              v-model="editedItem.crc"
              required
              label="Copy right content"/>
          <v-text-field
          prepend-icon="mdi-web"
                  outlined
                  dense
              :disabled="loading==true"
              ref="su"
              
              v-model="editedItem.su"
              required
              label="Server URL"/>
          
        <v-card outlined v-if="editedItem.imageURL">
            <v-img width="20%" height="30%" :src = editedItem.imageURL />
        </v-card>
        <v-card>
            <v-card v-if="!editedItem.imageURL" :disabled="proPicisUploading"
                @click="launchProPicFile">
                <input required ref="proPicFile"
                    @change.prevent="uploadProPicFile($event.target.files)" type="file"
                    accept="image/jpeg, image/png" style="width: 0; height: 0;">
                <v-progress-linear disabled="true" v-model="proPicProgress" height="25" v-if="proPicisUploading">
                    <strong>{{ Math.ceil(proPicProgress) }}%</strong>
                </v-progress-linear>
                <h2 style="text-align:center;">
                    <p>{{ proPicisUploading ? 'UPLOADING...' : 'UPLOAD LOGO' }}</p>
                    <v-icon size="50" style="align-self: center;">mdi-upload</v-icon>
                </h2>
            </v-card>
            <v-card-actions>
                <v-btn @click="pauseProPicUpload"
                    v-if="!editedItem.imageURL && proPicisUploading && proPicUploadStarted && proPicresumed">
                    Pause
                </v-btn>
                <v-btn @click="resumeProPicUpload"
                    v-if="!editedItem.imageURL && proPicisUploading && proPicUploadStarted && proPicpaused">
                    Resume
                </v-btn>
                <v-btn @click="cancelProPicUpload"
                    v-if="!editedItem.imageURL && proPicisUploading && proPicUploadStarted">
                    Cancel
                </v-btn>
                <v-btn :disabled="proPicisDeleting" @click="deleteProPic" v-if="editedItem.imageURL">
                    {{ proPicisDeleting ? 'Deleting...' : 'Delete' }}
                </v-btn>
            </v-card-actions>
        </v-card>
      </v-form>
              <div class="mt-5">
                <VBtn style="background-color: #183D0E; color: #FFC72C;" 
              :disabled="loading==true || editedItem.drawStarted" v-if="!saving"
               @click="save" block min-height="44" class="gradient">
                  Save
                </VBtn>
                <v-progress-circular v-if="saving || starping" style="width: 100%; margin: auto; color: #183D0E; " align = "center" indeterminate/>
                                
                <v-spacer/>
                <VBtn  class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-if="!editedItem.drawStarted && !starping"
               @click="startDraw" block min-height="44">
                  Start Draw
                </VBtn>
                <VBtn  class="mt-5 gradient" style="background-color: #183D0E; color: #FFC72C;" v-else-if="editedItem.drawStarted && !starping"
               @click="startDraw" block min-height="44">
                  Emergency Stop
                </VBtn>
              </div>
  </v-card>


</template>

<script>
// import databaseAccess from '../middleware/databaseAccess'

import 'firebase/compat/database';
import firebase from "firebase/compat/app"
import 'firebase/compat/storage'
import axios from 'axios';
// import Dropzone from 'nuxt-dropzone'
// import 'nuxt-dropzone/dropzone.css'
// let uuid = require('uuid')

export default {
  watch:{
      $route(){
          firebase.database().ref('Settings').off('value')
          // console.log('Leaving...  ')
      }
  },
  mounted(){
      // alert(firebase.auth().currentUser.uid)
    //   if (firebase.auth().currentUser.uid === "r11qt3HfbbVNIHNaQLZbePCKwDe2") {
        // this.userIsAdmin = true
        
        // firebase.database().ref('lottoNumbers').remove()
        // firebase.database().ref('allLottoNumbers').remove()
        firebase.database()
            .ref('Settings/SiteSetting')
            .on('value', (snapshot) =>{
                if(snapshot.exists()){
                    this.settings = []
                    // snapshot.forEach((child)=>{
                    //     this.settings.push(child.toJSON())
                        this.editedItem = snapshot.val()
                        this.loading = false
                        // console.log(this.editedItem)
                    // })
                }
                })
        // firebase.database()
        //     .ref('allLottoNumbers')
        //     .once('value', (snapshot) =>{
        //         if(snapshot.exists()){
        //             snapshot.forEach((child)=>{
        //                 console.log(child.toJSON())
        //                 // firebase.database().ref('allLottoNumbers').child(child.key).remove()
        //             })
                    
        //         }
        //         else{
        //             console.log('no data at this path');
        //         }
        //     })
    //   }
    //   else {
    //       console.log("Unauthorized access!!")
    //       this.userIsAdmin = false
    //   }

  },
  methods:{
    deleteProPic() {
            this.proPicisDeleting = true
            firebase.storage().refFromURL(this.editedItem.imageURL).delete()
                .then(() => {
                        this.editedItem.imageURL = '',
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
        uploadProPicFile(files) {
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

            // Create a reference to the destination where we're uploading
            // the file.
            const storage = firebase.storage()
            // var ext = file.name.split('.').pop()
            // alert(ext)
            const ref = storage.ref(`Settings/Logo.${file.name.split('.').pop().toLowerCase()}`)

            var uploadTask = ref.put(file, metadata)
            this.proPicUploadTask = uploadTask
            this.proPicUploadTask.on('state_changed',
                (snapshot) => {
                    this.proPicProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('Upload is ' + this.progress + '% done');
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            this.setSnackbarMessage('Upload is paused')
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            this.setSnackbarMessage('Upload is running')
                            break;
                    }
                },
                (error) => {
                    alert(error)
                },
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        this.proPicImageType = downloadURL.split('.').pop()
                        this.editedItem.imageURL = downloadURL
                        this.editedItem.imageURL = downloadURL
                        this.proPicisUploading = false
        
                    });
                }
            )
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
        save(){

            this.saving = true
            
            this.editedItem.UpdatedAt = Date.now();
            this.editedItem.drawStarted = false;
            // alert(this.editedItem.su)
            console.log(this.editedItem);

            fetch(`${this.editedItem.su}/update-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.editedItem),
            })
            .then(response => response.json())
            .then(data => this.setSnackbarMessage(data.message))
            .then(() => this.saving = false)
            .catch(error => this.setSnackbarMessage(error))

        },
        async startDraw() {
            this.starping = true
            try {
                const response = await fetch(`${this.editedItem.su}/start-draw`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({drawStarted: !this.editedItem.drawStarted}),
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.setSnackbarMessage(data.message)
                this.starping = false
                // console.log(data);
                
                
            } catch (error) {
                this.starping = false
                console.error('Error starting draw:', error);
                this.setSnackbarMessage(error)
                
            }

            // .then(response => response.json())
            // .then(data => this.setSnackbarMessage(data.message))
            // .then(() => this.saving = false)
            // .catch(error => this.setSnackbarMessage(error))

        },

  },

 data: () => ({
    snackBarText:'',
    timeout: 2000,
    snackbar:false,
    saving : false,
    starping : false,
    lottoNumbersgenerated : false,
    lottoNumbersgenerating : false,
  
    proPicImageType: null,
    
    proPicProgress: null,
    // editedItem.imageURL: '',
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
        drawStarted: false,
        sn: 'Millionair',
        pot: 10,
        mst: 10,
        dt: 30,
        sf: 50,
        dcb: 50,
        mindd: 15,
        maxdd: 30,
        apm: 80,
        maxdw: 15,
        maxdp: 30,
        dca: 550,
        dnw: 5,
        dwa: 1000000,
        crc: 'Million Cash Financing All Rights Reserved',
        su: '',
        imageURL:'',
        UpdatedAt:null,
        UpdatedBy: firebase.auth().currentUser.email,
    }
}),


}
</script>

<style>

</style>