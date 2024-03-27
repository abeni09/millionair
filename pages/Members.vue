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
        <div style="display: flex; margin: auto" class="my-5" >
            <v-row>
                <v-col align = "center" 
                cols="12"
                md="3"
                sm="3">
                    <v-select
                    outlined
                    dense
                    v-model="searchColumn"
                    :items="headers"
                    label="Column"
                    />
                </v-col>
                
                <v-col align = "center" 
                cols="12"
                md="6"
                sm="6">
                    <v-text-field dense outlined v-model="search" append-icon="mdi-magnify" label="Search" single-line />
                </v-col>
                <v-col class='mx-5' align = "center" 
                cols="12"
                md="2"
                sm="2">
                    <!-- <v-btn @click="searchMember" style="background-color: #183D0E; color: #FFC72C;">Search</v-btn> -->
                    <v-btn @click="showUserForm(false)" style="background-color: #183D0E; color: #FFC72C;" v-if="userHasPermission">Add</v-btn>
                    <!-- <v-btn @click="generateUsers" style="background-color: #183D0E; color: #FFC72C;" :disabled = "generating" v-if="!generating">Generate</v-btn>
                    <v-btn @click="generateUsers" style="background-color: #183D0E; color: #FFC72C;" :disabled = "generating" v-else-if="generating">Generating</v-btn> -->
                </v-col>
            </v-row>
            <!-- Add an "Add" button -->
        </div>
        <v-data-table :loading="loading"
            :headers="headers"
            :items="filteredUser"
            :footer-props="{
            'items-per-page-options': [10, 20, 30],
            'show-current-page': true,
            'show-text': true,
            'show-select': true,
            'align': 'center'
            }"
        >
        <!-- <template v-slot:body.append>
          <v-btn @click="loadNextPage" :loading="loadingMore" block>
            Load More
          </v-btn>
        </template> -->
            <template v-slot:item.actions="{ item }">
                <v-btn fab small inline class="ma-1"  v-if="userRole != null && userRole != 'Banker'" @click="editUser(item)">
                    <v-icon color="green" >mdi-pencil</v-icon>
                </v-btn>
                <v-btn fab small inline class="ma-1"  v-if="userRole != null && userRole != 'Banker'" @click="deleteUser(item)">
                    <v-icon color="red" >mdi-delete</v-icon>
                </v-btn>
                <v-btn fab small inline class="ma-1" @click="displayFullMemberInfo(item)">
                    <v-icon color="blue" >mdi-information</v-icon>
                </v-btn>
                <v-btn fab small inline class="ma-1" v-if="userRole != null && userRole != 'Agent'" @click="depositContribution(item)">
                    <v-icon color="green" >mdi-bank</v-icon>
                </v-btn>
                <!-- <v-btn fab small inline class="ma-1">
                    <v-icon color="blue" @click="addPhoneForMembers(item)">mdi-plus</v-icon>
                </v-btn> -->
                <!-- <v-btn fab small inline class="ma-1" v-if="MembersForVerification.includes(item.id) && userHasPermission">
                <v-icon color="green" @click="verifyUser(item)">mdi-check-decagram</v-icon>
                </v-btn> -->
            </template>
        </v-data-table>

        <!-- Add an export button -->
        <v-btn :disabled = "loading" @click="exportToExcel" color="primary">Export to Excel</v-btn>
        
  
        <!-- Dialog for adding User -->
        <v-dialog v-model="addDialog" max-width="600px">
            <v-card>
                <v-card-title class="bold-center" style="margin-bottom: 1%;">
                    {{ editUserMode ? 'Edit Member' : 'Add Member' }}
                </v-card-title>
                <v-card-text>
                    <v-form ref="UserForm" v-model="addFormValid" lazy-validation>
                    <!-- Personal Information -->
                    
                    <v-row>
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.batch_number" label="Batch" :items="potOptions"></v-select>
                    </v-row>
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Personal</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.name" label="Name"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.phone" label="Phone"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.age" label="Age"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.gender" label="Gender" :items="genderOptions"></v-select>
                        </v-col>
                    </v-row>
                    <v-row v-if="editUserMode">
                        <v-col>
                        
                            <v-card outlined v-if="newUser.profile_pic">
                                <v-img width="20%" height="30%" :src = "getProfileImageUrl" />
                            </v-card>
                            <v-card :disabled = "loading">
                                <ImageUpload label = "Profile Picture" :uploadUrl="server_url" :memberId = "newUser.id" imageName = "profile_pic"/>
                            </v-card>
                            
                        </v-col>

                    </v-row>
                    <v-row v-if="editUserMode">
                        <v-col cols="12" sm="6">
                        
                            <v-card outlined v-if="newUser.id_front">
                                <v-img width="20%" height="30%" :src = "getIDFrontImageUrl" />
                            </v-card>
                            <v-card :disabled = "loading">
                                <ImageUpload label = "Front ID" :uploadUrl="server_url" :memberId = "newUser.id" imageName = "id_front"/>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6">
                        
                            <v-card outlined v-if="newUser.id_back">
                                <v-img width="20%" height="30%" :src = "getIDBackImageUrl" />
                            </v-card>
                            <v-card :disabled = "loading">
                                <ImageUpload label = "Back ID" :uploadUrl="server_url" :memberId = "newUser.id" imageName = "id_back"/>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Address Information -->
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Address</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.city" label="City"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.subcity" label="Subcity"></v-text-field>
                        </v-col>
                    </v-row>          <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.woreda" label="Woreda"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.house_number" label="House Number"></v-text-field>
                        </v-col>
                    </v-row>

                    <!-- Respondent Information -->
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Respondent</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.respondent_name" label="Name"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.respondent_phone" label="Phone"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.respondent_relation" label="Relation" :items="familyRelations"></v-select>
                        </v-col>
                    </v-row>

                    <!-- Heir Information -->
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Heir</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.heir_name" label="Name"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.heir_phone" label="Phone"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.heir_relation" label="Relation" :items="familyRelations"></v-select>
                        </v-col>
                    </v-row>
                    </v-form>
                </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey darken-2" text @click="closeUserForm">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="saveUser" :disabled="!addFormValid">Submit</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- Dialog for displaying info -->
        <v-dialog v-model="displayInfoDialog" v-if="selectedMember" max-width="80%" persistent>
            <v-card>
            <v-card-title class="headline">
                Member Information <v-icon v-if = "selectedMember['won']" color="green" >mdi-check-decagram</v-icon>
            </v-card-title>

            <v-card-text>
                <v-list>
                <v-list-item-group>
                    <v-list-item v-for="(value, key) in memberFields" :key="key" v-if="selectedMember[key]">
                    <v-list-item-content>
                        <v-list-item-title>
                        <strong>{{ value }}:</strong> {{ valueFormatter(key, selectedMember[key]) }}
                        </v-list-item-title>
                    </v-list-item-content>
                    </v-list-item>
                </v-list-item-group>
                </v-list>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeMemberInfo">Close</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>  
        <!-- Dialog for deposit -->
        <v-dialog v-model="depositContributionDialog" v-if="selectedMember" max-width="50%" persistent>
            <v-card>
                <v-card-title class="headline">
                    Deposit Contribution
                </v-card-title>

                <v-card-text>
                            <v-text-field
                            outlined
                            dense
                            v-model="newDeposit.amount"
                            label="Enter Amount"
                            type="number"
                            ></v-text-field>
                            <div style="align-items: center;">
                                <strong v-if="depositing && !alreadyWon" style="width: 100%; text-align: center;">Generating lotto numbers</strong>
                                <v-progress-circular v-if="depositing" style="width: 100%; margin: auto; color: #183D0E; " align = "center" indeterminate/>
                                <v-btn style="background-color: #183D0E; color: #FFC72C; width: 100%;" v-else-if="!depositing" @click="performDeposit">Deposit</v-btn>
                        
                            </div>
                </v-card-text>

                <v-card-actions v-if="!depositing" >
                    <v-btn style="width: 100%;" color="blue darken-1" text @click="closeMemberInfo">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>       
        <v-dialog v-model="confirmDeleteDialog" max-width="400px">
            <v-card>
            <v-card-title class="headline centered-title" style="background-color: #ff5722; margin-bottom: 1%;">
                Confirm Deletion
            </v-card-title>
            <v-card-text>
                Are you sure you want to delete this User?
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="cancelDelete">Cancel</v-btn>
                <v-btn color="red darken-1" text @click="confirmDelete">Delete</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>

    </div>
</template>
  
<script>
import 'firebase/compat/database';
import firebase from 'firebase/compat/app';
import { format , subDays  } from 'date-fns';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { writeFile, utils } from 'xlsx';
import ImageUpload from '~/components/ImageUpload.vue';

export default {
    
    computed: {
        getIDFrontImageUrl() {
            return `${this.server_url}/uploads/${this.newUser.id}/${this.newUser.id_front}`;
        },
        getIDBackImageUrl() {
            return `${this.server_url}/uploads/${this.newUser.id}/${this.newUser.id_back}`;
        },
        getProfileImageUrl() {
            return `${this.server_url}/uploads/${this.newUser.id}/${this.newUser.profile_pic}`;
        }
    },
    components: {
        ImageUpload
    },
    // validations: {
    //     newUser: UserValidations,
    // },
    async mounted() {
        
    const token = localStorage.getItem('token');
    const settingToken = localStorage.getItem('settings');
    // const pots = localStorage.getItem('pots');
    if (token) {
      // Decode the JWT token to extract user information
      const decodedToken = jwt.decode(token);
      this.siteSettingsValues = JSON.parse(settingToken)
    //   const settingToken = jwt.decode(siteSettings);
    //   console.log(settingToken);
      if (decodedToken) {
        // this.$store.dispatch('auth/login', decodedToken);
        this.currentUser = decodedToken
        this.userRole = decodedToken.role
        if (this.userRole == 'Admin') {
            // this.server_url = decodedToken.
            this.userHasPermission = true;
        }
        else{
            this.userHasPermission = false
        }
        // if (!this.userHasPermission) {
        //     this.$router.push('/')
        // }
        // else{
        if (this.siteSettingsValues.batch_amount) {
            for (let index = 1; index < parseInt(this.siteSettingsValues.batch_amount)+1; index++) {
                this.potOptions.push(index)
            }
            console.log(this.potOptions);
        }
        else{
            console.log("pots unavailable");
        }
        if (this.siteSettingsValues.server_url) {
            this.server_url = this.siteSettingsValues.server_url  
            // this.fetchMembers()     
            this.loading = false        
        } else {
            console.log('Invalid setting token.');
            this.$store.dispatch('auth/logout')
            
        }

        // }
      } else {
        console.log('Invalid JWT token.');
        this.$store.dispatch('auth/logout')
      }
    } else {
      console.log('JWT token not found.');
      this.$store.dispatch('auth/logout')
    }
    },
    data() {
        return {
            siteSettingsValues: null,
            server_url: null,
            loadingMore: false,
            batch_number:1,
            snackBarText:'',
            timeout: 2000,
            snackbar:false,
            depositing : false,
            depositingRollNumber : 0,
            totalLottoTogenerate : 0,
            fetching : false,
            verifying : false,
            UserToDelete: null,
            UserToVerify: null,
            phonePrefix: '+251',
            MembersForVerification: [], 
            displayInfoDialog:false,
            depositContributionDialog:false,
            userRole: null,
            currentUser:null,
            currentUrl:null,
            currentPhone:null,
            userHasPermission: false,
            generating: false,
            loading:true,
            minDate: subDays(new Date(), 1), // Set the minimum date to one day before today
            searchColumn: "name",
            User: [],
            search: "",
            filteredUser: [], // Filtered User based on search
            genderOptions: ["Male", "Female"],
            potOptions: [],
            familyRelations : [
                "Adopted Child",
                "Adoptive Parent",
                "Brother",
                "Brother-in-law",
                "Daughter",
                "Daughter-in-law",
                "Father",
                "Father-in-law",
                "Granddaughter",
                "Grandson",
                "Great-Aunt",
                "Great-Granddaughter",
                "Great-Grandfather",
                "Great-Nephew",
                "Great-Niece",
                "Great-Uncle",
                "Husband",
                "Maternal Aunt",
                "Maternal Grandfather",
                "Maternal Grandmother",
                "Maternal Great-Aunt",
                "Maternal Great-Grandfather",
                "Maternal Great-Grandmother",
                "Maternal Great-Uncle",
                "Mother",
                "Mother-in-law",
                "Nephew",
                "Niece",
                "Paternal Aunt",
                "Paternal Cousin",
                "Paternal Grandfather",
                "Paternal Grandmother",
                "Paternal Great-Aunt",
                "Paternal Great-Grandfather",
                "Paternal Great-Grandmother",
                "Paternal Great-Uncle",
                "Paternal Uncle",
                "Sister",
                "Sister-in-law",
                "Son",
                "Son-in-law",
                "Stepbrother",
                "Stepfather",
                "Stepsister",
                "Stepmother",
                "Wife"
            ],
            lottoSettingsValues: [],
            selectedCode: null,
            selectedMember: null,
            memberFields: {
                won: 'Won',
                batch_number: 'Batch',
                name: 'Name',
                email: 'Email',
                age: 'Age',
                gender: 'Gender',
                phone: 'Phone',
                city: 'City',
                subcity: 'Subcity',
                woreda: 'Woreda',
                respondent_ame: 'Respondent',
                respondent_phone: 'Respondent Phone',
                respondent_relation: 'Respondent Relation',
                heir_name: 'Heir',
                heir_phone: 'Heir Phone',
                heir_relation: 'Heir Relation',
                addedAt: 'Added Date',
                addedBy: 'Added By',
                lastDate: 'Last Lotto Date',
            },
            selectedSupervisor: null,
            // roleOptions: ["Admin", "User", "Supervisor"],
            headers: [
                { text: 'Name', value: 'name' },
                { text: 'Phone', value: 'phone' },
                { text: 'Age', value: 'age' },
                { text: 'Gender', value: 'gender' },
                { text: 'Batch_number', value: 'batch_number' },
                { text: 'Added', value: 'addedAt' },
                { text: '', value: 'actions', sortable: false }
            ],
            confirmDeleteDialog: false,
            confirmVerifyDialog: false, 
            editUserMode: false,
            addDialog: false, // Flag to control the display of the add User dialog
            addFormValid: false, // Flag to track the validity of the add User form
            addPhoneFormValid: false, // Flag to track the validity of the add phone for member form
            newUser: {},   
            alreadyWon:false,         
            penalized:false,         
            penalizedAmount:0,         
            newDeposit: {
                id:null,
                amount: 0,
                depositedBy: null,
                depositedAt: null,
                dailyContribution: null,
                lottoNumber:null,
            },
            BackIDisUploading : false,
            BackIDUploadStarted : false,
            BackIDUploadTask : null,
            BackIDProgress : null,
            BackIDisDeleting : false,
            BackIDImageType : null,
            BackIDpaused : false,
            BackIDcancelled : false,
            BackIDresumed : false,
            FrontIDisUploading : false,
            FrontIDUploadStarted : false,
            FrontIDUploadTask : null,
            FrontIDProgress : null,
            FrontIDisDeleting : false,
            FrontIDImageType : null,
            FrontIDpaused : false,
            FrontIDcancelled : false,
            FrontIDresumed : false,
            BATCH_SIZE : 1000,
            lastKey : 0,
            rules: {
            required: value => !!value || "*Required.",
            phoneNumberRule: value => {
                const isValidNumber = /^[79]\d{8}$/.test(value);
                return isValidNumber || 'Phone number must start with 9 or 7 and be a 9-digit number.';
            }
            // min: v => (v && v.length >= 8) || "Min 8 characters",
            },
            searchTimer: null
        };
    },
    
    watch: {
        
        batch_number: 'fetchDataForSelectedPot',

        
      search(newValue) {
        // Check if the search input is empty
        if (newValue.trim()) {
            // Clear previous timer
            clearTimeout(this.searchTimer);
            // Set a new timer to execute the search function after 2 seconds
            this.searchTimer = setTimeout(() => {
                this.fetchSearchResults(newValue, this.searchColumn);
            }, 2000); // Change delay time as needed (2000 milliseconds = 2 seconds)
        }
        else{
            // Clear previous timer
            clearTimeout(this.searchTimer);
        }
      },
    },
    methods: { 
        async fetchSearchResults(keyword, column){
            try {
                this.loading = true
                const response = await fetch(`${this.server_url}/searchMembers/${column}/${keyword}`, {
                // const response = await fetch(`http://localhost:3006/searchMembers/${column}/${keyword}`, {
                    method: 'GET',
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.User = data.results;

                this.filteredUser = this.User;
                this.loading = false
            } catch (error) {
                console.error('Error updating deposit:', error);
                this.setSnackbarMessage(error)
                this.loading = false
                return false
                
            }

        },
        setSnackbarMessage(_value){
            this.snackbar = true;
            this.snackBarText = _value
        },
        valueFormatter(key, value) {
            // You can add custom formatting logic here if needed
            return value;
        }, 
        displayFullMemberInfo(item){
            console.log(item);
            this.selectedMember = item
            this.displayInfoDialog = true
        },
        depositContribution(item){
            if (item.lastDate) {
                var daysDifference = this.daysAheadOfToday(item.lastDate); 
                // alert(daysDifference)
                console.log(item);
                
            }
            this.selectedMember = item
            this.depositContributionDialog = true
        },
        formatDate(timestamp) {
            return format(new Date(timestamp), 'MMM dd,yyyy');
            // return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
        },
        formatTime(timestamp) {
            return format(new Date(timestamp), 'HHmmss');
            // return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
        },
        editUser(User) {
            this.editUserMode = true;
            this.newUser = User;
            this.showUserForm(true);
        },

        deleteUser(User) {
            this.confirmDeleteUser(User);
        },

        showUserForm(edit) {
            this.editUserMode = edit;
            if (!edit) {
                this.newUser = {};
            }
            this.UserFormValid = false;
            this.addDialog = true;
        },

        closeUserForm() {
            this.addDialog = false;
            // this.$refs.UserForm.reset();
            this.editUserMode = false;
            this.selectedMember = null;
            this.newUser = {};
        },
        
        daysAheadOfToday(formattedDate) {
            if (formattedDate == null) {
                return 0
            }
            // Define months array
            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            // Extract day, month, and year from the formatted date
            const monthAbbreviation = formattedDate.slice(0, 3);

            // Check the length of the day part
            let day;
            if (formattedDate.length === 9) {
            day = parseInt(formattedDate.slice(3, 5), 10); // Day has two digits
            } else if (formattedDate.length === 8) {
            day = parseInt(formattedDate.slice(3, 4), 10); // Day has one digit
            } else {
            console.log("Invalid formatted date length");
            // Handle the case where the length is neither 8 nor 9 as needed
            }

            // Extract the year substring dynamically
            const year = parseInt(formattedDate.slice(-4), 10);



            // Convert month abbreviation to month index
            const monthIndex = months.indexOf(monthAbbreviation);

            // Create a Date object for the input date
            const inputDate = new Date(year, monthIndex, day);

            // Get today's date
            const today = new Date();

            // Calculate the difference in milliseconds
            const differenceInMs = inputDate - today;

            // Convert milliseconds to days
            var daysAhead = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
            // alert(daysAhead)

            // if (daysAhead < 0) {
            //     daysAhead = 0
            // }
            // else{
            //     daysAhead = parseInt(daysAhead) + 1
            // }

            return daysAhead;
        },
        async performDeposit(){
            this.depositing = true
            this.penalized = false
            this.depositingRollNumber = 0
            var lastDate = this.selectedMember.lastDate
            // if (lastDate == null) {
            //     lastDate = this.formatDate(Date.now()).toString().replace(',', '').replace(' ','')
            // }
            const minDD = parseInt(this.siteSettingsValues.min_deposit_days)
            const maxDD = parseInt(this.siteSettingsValues.max_deposit_days)
            const maxDP = parseInt(this.siteSettingsValues.max_days_to_penalize)
            const maxDW = parseInt(this.siteSettingsValues.max_days_to_wait)
            var serviceFee = parseInt(this.siteSettingsValues.service_fee)
            const penalityAmount = parseInt(this.siteSettingsValues.penality_fee)
            // console.log(this.daysAheadOfToday(lastDate)<(maxDW * -1));
            if (this.daysAheadOfToday(lastDate)<(maxDW * -1)) {
                this.setSnackbarMessage(`This user has been disallowed to deposit (${maxDW} days passed)`);
                this.depositing = false;
                return false
            }
            if (this.selectedMember.won == true) {
                this.newDeposit.dailyContribution = this.siteSettingsValues.deposit_contribution_after
                this.alreadyWon = true
                if (this.daysAheadOfToday(lastDate) < (maxDP * -1)) {
                    this.setSnackbarMessage(`This user has been penalized (${maxDP} days passed)`);
                    this.penalized = true
                    this.penalizedAmount = penalityAmount * this.daysAheadOfToday(lastDate) * -1
                }
            } else {
                this.newDeposit.dailyContribution = this.siteSettingsValues.deposit_contribution_before
                serviceFee = 0
                this.alreadyWon = false              
            }
            if (!this.depositing) {
                return false
            }
            console.log(this.newDeposit);
            console.log(this.siteSettingsValues);
            if (this.newDeposit.dailyContribution != null && this.newDeposit.amount != 0) {
                const amount = parseInt(this.newDeposit.amount)
                const dailyContribution = parseInt(this.newDeposit.dailyContribution)
                var totalLottoTogenerate = amount/dailyContribution
                var netAmount = amount;
                if (this.alreadyWon) {
                    totalLottoTogenerate = Math.floor((amount - this.penalizedAmount)/(dailyContribution + serviceFee))
                    netAmount = amount - this.penalizedAmount
                }
                if (netAmount % (dailyContribution + serviceFee ) === 0) {
                    console.log('divisibile')
                    if (!this.alreadyWon) {
                        if (netAmount/dailyContribution < minDD) {
                            this.setSnackbarMessage(`Minimum amount required is: ${minDD * dailyContribution} `)
                            this.depositing = false 
                            return false;
                        }
                    } 
                    else{
                        if (netAmount/(dailyContribution + serviceFee) >= maxDD) {
                            this.setSnackbarMessage(`Maximum amount posssible is: ${(maxDD * (dailyContribution + serviceFee))+ this.penalizedAmount} `)
                            this.depositing = false 
                            return false;
                        }
                        // else if (netAmount/(dailyContribution + serviceFee) < (this.daysAheadOfToday(lastDate) * -1)) {
                        //     this.setSnackbarMessage(`You need to cover the penality days: ${(this.daysAheadOfToday(lastDate) * -1)} `)
                        //     this.depositing = false 
                        //     return false;
                        // }
                        else if (netAmount/(dailyContribution + serviceFee) < 30) {
                            this.setSnackbarMessage(`You need to cover the penality days: 30 (1 month) `)
                            this.depositing = false 
                            return false;
                        }
                    }
                    
                    this.depositing = await this.loopLottoUpdate(this.penalizedAmount,this.selectedMember.id,netAmount - (serviceFee * totalLottoTogenerate), this.currentUser.userId);
                    this.closeMemberInfo()
                }
                else{
                    console.log('not divisibile')
                    if (this.penalizedAmount > 0) {
                        // this.setSnackbarMessage(`(Penalized ${this.penalizedAmount}) ${netAmount} is not divisibile by ${dailyContribution + serviceFee}. Try ${(this.daysAheadOfToday(lastDate) * -1) * (dailyContribution + serviceFee) + this.penalizedAmount}`)
                        this.setSnackbarMessage(`(Penalized ${this.penalizedAmount}) ${netAmount} is not divisibile by ${dailyContribution + serviceFee}. Try ${30 * (dailyContribution + serviceFee) + this.penalizedAmount}`)
                    } else {
                        this.setSnackbarMessage(`${netAmount} is not divisibile by ${dailyContribution + serviceFee}. Try products of ${dailyContribution + serviceFee}`)
                    }
                    this.depositing = false 
                }
                    
            } else {
                this.depositing = false
                console.log(this.newDeposit.amount); 
                console.log(this.newDeposit.dailyContribution); 
                if (this.newDeposit.amount == 0 || this.newDeposit.amount == null) {
                    this.setSnackbarMessage(`Please enter a valid number to process deposit`)
                    
                } else {
                    this.setSnackbarMessage(`Please reload this page and try again. If issue persists contact your administrator`)
                    
                }              
            }

        },
        async loopLottoUpdate(penalityAmount ,selectedMember, amount, currentUser){
            try {
                const response = await fetch(`${this.server_url}/processDeposit`, {
                // const response = await fetch(`http://localhost:3006/processDeposit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        {
                            penality: penalityAmount,
                            amount:amount, 
                            member:selectedMember, 
                            user:currentUser, 
                        }),
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.setSnackbarMessage(data.message)
                if (data.success) {
                    return false
                }
            } catch (error) {
                console.error('Error updating deposit:', error);
                this.setSnackbarMessage(error)
                return false
                
            }

                   
        },
        async fetchMembers(){
            this.loading = true;
            try {
                const response = await fetch(`${this.server_url}/fetchMembers`, {
                // const response = await fetch(`http://localhost:3006/fetchMembers`, {
                    method: 'GET',
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.User = data.members;

                this.filteredUser = this.User;
                
                
            } catch (error) {
                console.error('Error fetching members:', error);
                this.setSnackbarMessage(error)
                // return false
                
            }
            this.loading = false;
        },
        saveUser() {
            if (this.$refs.UserForm.validate()) {
                const userData = this.editUserMode ? this.getUpdatedUserData() : this.getNewUserData();

                // Perform POST request using fetch
                fetch(`${this.server_url}/saveMember`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({userData : userData, edit: this.editUserMode, memberId: this.newUser.id})
                })
                .then(async response => {
                    if (!response.ok) {
                        const finalResponse = await response.json()
                        console.log(finalResponse);
                        throw new Error(finalResponse.message);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('User saved successfully:', data);
                    this.setSnackbarMessage(data.message)
                    this.closeUserForm();
                    // Handle success if needed
                })
                .catch(error => {
                    console.error('Error saving user:', error.message);
                    this.setSnackbarMessage(error.message)
                    // Handle error if needed
                });
            }
        },
        getUpdatedUserData() {
            return {
                batch_number: this.newUser.batch_number,
                name: this.newUser.name,
                phone: this.newUser.phone,
                age: this.newUser.age,
                gender: this.newUser.gender,
                profile_pic: this.newUser.profile_pic,
                id_front: this.newUser.id_front,
                id_back: this.newUser.id_back,
                city: this.newUser.city,
                subcity: this.newUser.subcity,
                woreda: this.newUser.woreda,
                house_number: this.newUser.house_number,
                respondent_name: this.newUser.respondent_name,
                respondent_phone: this.newUser.respondent_phone,
                respondent_relation: this.newUser.respondent_relation,
                heir_name: this.newUser.heir_name,
                heir_phone: this.newUser.heir_phone,
                heir_relation: this.newUser.heir_relation,
                updatedAt: Date.now(),
                updatedBy: this.currentUser.userId
            };
        },
        getNewUserData() {
            return {
                batch_number: this.newUser.batch_number,
                name: this.newUser.name,
                phone: this.newUser.phone,
                age: this.newUser.age,
                gender: this.newUser.gender,
                id_front: this.newUser.id_front,
                id_back: this.newUser.id_back,
                city: this.newUser.city,
                subcity: this.newUser.subcity,
                woreda: this.newUser.woreda,
                house_number: this.newUser.house_number,
                respondent_name: this.newUser.respondent_name,
                respondent_phone: this.newUser.respondent_phone,
                respondent_relation: this.newUser.respondent_relation,
                heir_name: this.newUser.heir_name,
                heir_phone: this.newUser.heir_phone,
                heir_relation: this.newUser.heir_relation,
                winAmount: this.siteSettingsValues.dwa,
                won: false,
                isonline: false,
                isbanned: false,
                addedAt: Date.now(),
                addedBy: this.currentUser.userId
            };
        },


        confirmDeleteUser(User) {
            this.UserToDelete = User;
            this.confirmDeleteDialog = true;
        },

        async confirmDelete() {
            if (this.UserToDelete) {
                try {
                    const response = await fetch(`${this.server_url}/deleteMember/${this.UserToDelete.id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete member');
                    }

                    const data = await response.json();
                    console.log('Member deleted successfully:', data.message);
                    this.setSnackbarMessage(data.message)
                    this.confirmDeleteDialog = false;
                    this.filteredUser = this.User.filter(
                    (User) => User.id !== this.UserToDelete.id
                    );
                    // Handle success if needed
                } catch (error) {
                    console.error('Error deleting member:', error.message);
                    this.setSnackbarMessage(error.message)
                    // Handle error if needed
                }
                
            }
        },
        // Function to cancel the delete action
        cancelDelete() {
          this.closeDeleteDialog();
        },
        closeMemberInfo(){
            this.depositing = false
            this.displayInfoDialog = false
            this.depositContributionDialog = false
            this.selectedMember = null
        },

        // Function to close the delete confirmation dialog
        closeDeleteDialog() {
          this.confirmDeleteDialog = false;
          this.UserToDelete = null;
        },
        getCurrentDateFormatted() {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const day = String(currentDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        },
        getDatePathFormatted(datePath) {
            // Assuming datePath has a format like 'Jan122024'
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const year = datePath.slice(-4);
            const monthIndex = monthNames.indexOf(datePath.slice(0, 3));
            const day = datePath.slice(3, 5);

            return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day}`;
        },
        exportToExcel() {
        // Prepare data for export (use filteredUser instead of User)
        const data = this.filteredUser.map(User => ({
            Name: User.name,
            Phone: User.phone,
            Age: User.age,
            Gender: User.gender,
            City: User.city,
            Subcity: User.subcity,
            Woreda: User.woreda,
            "House Number": User.house_number,
            "Respondent Name": User.respondent_name,
            "Respondent Phone": User.respondent_phone,
            "Respondent Relation": User.respondent_relation,
            "Heir Name": User.heir_name,
            "Heir Phone": User.heir_phone,
            "Heir Relation": User.heir_relation,
            'Added At': User.addedAt,
        }));

        // Create a worksheet
        const ws = utils.json_to_sheet(data);

        // Create a workbook
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Members");

        // Export the workbook to a file
        writeFile(wb, "Members.xlsx");
        },
    },
};
</script>
<style scoped>
.bold-center {
  font-weight: bold;
  text-align: center !important;
}
</style>