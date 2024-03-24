<template>
    <div>
        
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
    <v-card @click="launchProPicFile" :disabled="uploading">
        
        <!-- <v-card v-if="editedItem.image_url" 
            > -->
            <input required ref="fileInput"
                @change="handleFileChange" type="file" style="width: 0; height: 0;">
            <!-- <v-progress-linear disabled="true" v-model="proPicProgress" height="25" v-if="uploading">
                <strong>{{ Math.ceil(proPicProgress) }}%</strong>
            </v-progress-linear> -->
            <h2 style="text-align:center;">
                <p>{{ getUploadingMessage }}</p>
                <v-icon size="50" style="align-self: center;">mdi-upload</v-icon>
            </h2>
        <!-- </v-card> -->
        <!-- <label>{{ label }}</label> -->
        <!-- <input type="file" ref="fileInput" @change="handleFileChange">
        <p v-if="errorMessage">{{ errorMessage }}</p> -->
        <!-- <v-img v-if="imageUrl" :src="getImageUrl" :alt="imageName"/> -->
    </v-card>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    
    computed: {
        getUploadingMessage() {
            if (this.uploading) {
                return `Uploading ${this.label} ...`
                
            } else {
                return `Upload ${this.label}`
                
            }
        }
    },
    props: {
      uploadUrl: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      memberId: {
        type: Number,
        // required: true
      },
      imageName: {
        type: String,
        // required: true
      }
    },
    data() {
      return {
        uploading: false,
        snackbar: false,
        snackBarText: '',
        timeout: 2000,
        errorMessage: '',
        imageUrl: '' // Store the URL of the uploaded image
      };
    },
    methods: {
        
        launchProPicFile() {
            this.$refs.fileInput.click()
        },
        
        setSnackbarMessage(_value){
            this.snackbar = true;
            this.snackBarText = _value
        }, 
      async handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) {
          this.errorMessage = 'No file selected';
          // Reset the input field
          this.$refs.fileInput.value = '';
          this.setSnackbarMessage(this.errorMessage)
          return;
        }
        if (!file.type.startsWith('image/')) {
          this.errorMessage = 'Selected file is not an image';
          // Reset the input field
          this.$refs.fileInput.value = '';
          this.setSnackbarMessage(this.errorMessage)
          return;
        }
        this.uploading = true
  
        const formData = new FormData();
        // Rename the file
        var renamedFilename
        if (this.memberId) {
            renamedFilename = `${this.memberId}-${this.imageName}.${file.name.split('.').pop()}`;
            
        }
        else{
            renamedFilename = `${this.imageName}.${file.name.split('.').pop()}`;

        }

        // Create a new File object with the renamed file
        const renamedFile = new File([file], renamedFilename, { type: file.type });
        formData.append('file', renamedFile);
        formData.append('memberId', this.memberId);
        formData.append('imageName', this.imageName);


        try {
            const response = await fetch(`${this.uploadUrl}/uploadImage`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const responseData = await response.json();
            console.log(responseData);

            // Set the imageUrl to the URL of the uploaded image
            if (responseData.filename) {
                this.imageUrl = `${this.uploadUrl}/${responseData.filename}`;
            }

            // Reset the input field
            this.$refs.fileInput.value = '';
            this.setSnackbarMessage('Image uploaded successfully');
            this.uploading = false;
            } catch (error) {
            console.error('Error uploading image:', error.message);
            // Reset the input field
            this.$refs.fileInput.value = '';
            this.setSnackbarMessage(error.message);
            this.uploading = false;
            }

      }
    }
  }
  </script>
  