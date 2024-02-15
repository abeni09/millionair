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
                <v-col align = "center" 
                cols="12"
                md="3"
                sm="3">
                    <v-btn @click="showAddForm" style="background-color: #183D0E; color: #FFC72C;" v-if="userHasPermission">Add</v-btn>
                </v-col>
            </v-row>
            <!-- Add an "Add" button -->
        </div>
        <v-data-table :loading="loading"
            :headers="headers"
            :items="filteredUser"
            :search="search"
        >
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
        <v-btn @click="exportToExcel" color="primary">Export to Excel</v-btn>
        
  
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
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.pot" label="Pot" :items="potOptions"></v-select>
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
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.email" label="Email"></v-text-field>
                        </v-col>
                        <!-- <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.gender" label="Phone" :items="genderOptions"></v-select>
                        </v-col> -->
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
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.houseNumber" label="House Number"></v-text-field>
                        </v-col>
                    </v-row>

                    <!-- Respondent Information -->
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Respondent</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.respondentName" label="Name"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.respondentPhone" label="Phone"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.respondentRelation" label="Relation" :items="familyRelations"></v-select>
                        </v-col>
                    </v-row>

                    <!-- Heir Information -->
                    <v-card-subtitle class="label text-grey-darken-2 bold-center">Heir</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.heirName" label="Name"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                        <v-text-field :rules="[rules.required]" outlined dense v-model="newUser.heirPhone" label="Phone"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6">
                        <v-select :rules="[rules.required]" outlined dense v-model="newUser.heirRelation" label="Relation" :items="familyRelations"></v-select>
                        </v-col>
                    </v-row>
                    </v-form>
                </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey darken-2" text @click="closeAddForm">Cancel</v-btn>
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
                                <strong v-if="depositing && !alreadyWon" style="width: 100%; text-align: center;">Generating {{ totalLottoTogenerate }} lotto numbers</strong>
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

export default {
    // validations: {
    //     newUser: UserValidations,
    // },
    async mounted() {
        // this.fetchDataFromAPI()
        
        // Fetch user permissions from Firebase database when the component mounts
        // this.fetchUserRole();
        await firebase.auth().onAuthStateChanged(user => {
            this.currentUser = user
            
            // Fetch user permissions from Firebase database when the component mounts
            this.fetchUserRole();
        })
        // this.fetchUser()
        const datePath = this.formatDate(Date.now()).toString().replace(',', '').replace(' ','')
        const database = firebase.database();
        const UserRef = database.ref('Members/');
        const potsRef = database.ref('Users/');
        const siteSettingsRef = database.ref('Settings/SiteSetting');
        const lottoSettingsRef = database.ref('Settings/LottoSetting');
        const lottoNumbersRef = database.ref('LottoNumber')
        
        lottoNumbersRef
        .on('value', snapshot => {
            if (snapshot.exists()) {
                console.log(snapshot.val());
            }
            else{
                console.log('no data found');
            }
        });       

        siteSettingsRef
        // .orderByChild('status').equalTo('Open')
        .on('value', snapshot => {
            if (snapshot.exists()) {
                this.siteSettingsValues.updatedAt = snapshot.val()['UpdatedAt'];
                this.siteSettingsValues.crc = snapshot.val()['crc'];
                this.siteSettingsValues.dca = snapshot.val()['dca'];
                this.siteSettingsValues.mindd = snapshot.val()['mindd'];
                this.siteSettingsValues.maxdd = snapshot.val()['maxdd'];
                this.siteSettingsValues.dcb = snapshot.val()['dcb'];
                this.siteSettingsValues.dnw = snapshot.val()['dnw'];
                this.siteSettingsValues.dwa = snapshot.val()['dwa'];
                this.siteSettingsValues.imageUrl = snapshot.val()['imageURL'];
                this.siteSettingsValues.mst = snapshot.val()['mst'];
                this.siteSettingsValues.pot = snapshot.val()['pot'];
                this.siteSettingsValues.sn = snapshot.val()['sn'];
                this.siteSettingsValues.su = snapshot.val()['su'];
                this.siteSettingsValues.sf = snapshot.val()['sf'];
                this.siteSettingsValues.maxdp = snapshot.val()['maxdp'];
                this.siteSettingsValues.maxdw = snapshot.val()['maxdw'];
                this.siteSettingsValues.apm = snapshot.val()['apm'];
                
                var pots = parseInt(this.siteSettingsValues.pot) + 1
                for (let index = 1; index < pots ; index++) {
                    this.potOptions.push(`Pot ` + index)
                }

            }
        });        
        lottoSettingsRef
        // .orderByChild('status').equalTo('Open')
        .on('value', snapshot => {
            this.lottoSettingsValues = []
            if (snapshot.exists()) {
                snapshot.forEach(element => {
                    var newElement = {
                        pot: null,
                        currentLottoNumber: null,
                        rollNumber: null,
                        updatedAt: null,
                    }
                    newElement.pot = element.key
                    newElement.currentLottoNumber = element.val()['currentLottoNumber']
                    newElement.rollNumber = element.val()['rollNumber']
                    newElement.updatedAt = element.val()['updatedAt']
                    this.lottoSettingsValues.push(newElement)
                });
                console.log(this.lottoSettingsValues);
                // this.lottoSettingsValues.updatedAt = snapshot.val()['UpdatedAt'];
                // this.lottoSettingsValues.currentLottoNumber = snapshot.val()['currentLottoNumber'];
                // this.lottoSettingsValues.rollNumber = snapshot.val()['rollNumber'];

            }
            // else{
            //     this.lottoSettingsValues.updatedAt = Date.now();
            //     this.lottoSettingsValues.currentLottoNumber = "000000000";
            //     this.lottoSettingsValues.rollNumber = "0";
            //     lottoSettingsRef.set(this.lottoSettingsValues)

            // }
        });
        UserRef
        // .orderByChild('status').equalTo('Open')
        .on('value', snapshot => {
            if (snapshot.exists()) {
                this.User = [];
                snapshot.forEach(childSnapshot => {
                    const User = childSnapshot.val();
                    // if (User.role == "Supervisor") {
                        if (User.addedAt) {
                            User.addedAt = this.formatDate(User.addedAt) 
                        }
                        // console.log(this.userHasPermission);
                        if (!this.userHasPermission) {
                            if (this.userRole == "Agent") {
                                if (User.addedBy == this.currentUser.email) {
                                    // console.log(User);
                                    this.User.push(User);
                                }
                            }
                            else if (this.userRole == "Banker") {
                                this.User.push(User);	
                                
                            }
                        }
                        else if (this.userHasPermission) {
                            // alert(this.userRole)
                            // if (User.potID == this.currentUser.uid) {
                                // console.log(User);
                                this.User.push(User);
                            // }
                        }
                        // alert(User.updatedAt)
                        this.filteredUser = this.User
                            
                    // }
                });
                this.loading = false;
                
            }
            else{
                this.User = [];
                this.loading = false;
            }
        });
    },
    data() {
        return {
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
            phoneNumbers: [''], 
            MembersForVerification: [], 
            displayInfoDialog:false,
            depositContributionDialog:false,
            userRole: null,
            currentUser:null,
            currentUrl:null,
            currentPhone:null,
            userHasPermission: false,
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
            siteSettingsValues: {
                updatedAt: null,
                crc: null,
                dca: null,
                mindd: null,
                maxdd: null,
                sf: null,
                maxdw: null,
                maxdp: null,
                apm: null,
                dcb: null,
                dnw: null,
                dwa: null,
                imageUrl: null,
                mst: null,
                pot: null,
                sn: null,
                su: null,
            },
            lottoSettingsValues: [],
            selectedCode: null,
            selectedMember: null,
            memberFields: {
                won: 'Won',
                // winAmount: 'Win Amount',
                // winDate: 'Win Date',
                pot: 'Pot',
                name: 'Name',
                email: 'Email',
                age: 'Age',
                gender: 'Gender',
                phone: 'Phone',
                city: 'City',
                subcity: 'Subcity',
                woreda: 'Woreda',
                respondentName: 'Respondent',
                respondentPhone: 'Respondent Phone',
                respondentRelation: 'Respondent Relation',
                heirName: 'Heir',
                heirPhone: 'Heir Phone',
                heirRelation: 'Heir Relation',
                addedAt: 'Added Date',
                addedBy: 'Added By',
                lastDate: 'Last Lotto Date',
            },
            selectedSupervisor: null,
            // roleOptions: ["Admin", "User", "Supervisor"],
            headers: [
                { text: 'Name', value: 'name' },
                { text: 'Phone Number', value: 'phone' },
                { text: 'Age', value: 'age' },
                { text: 'Gender', value: 'gender' },
                { text: 'Pot', value: 'pot' },
                { text: 'Added', value: 'addedAt' },
                { text: '', value: 'actions', sortable: false }
            ],
            confirmDeleteDialog: false,
            confirmVerifyDialog: false, 
            editUserMode: false,
            addDialog: false, // Flag to control the display of the add User dialog
            addFormValid: false, // Flag to track the validity of the add User form
            addPhoneFormValid: false, // Flag to track the validity of the add phone for member form
            newUser: {
                id:null,
                name: null,
                email: null,
                phone: null,
                age:null,
                gender: null,
                city: null,
                subcity: null,
                woreda:null,
                houseNumber: null,
                respondentName: null,
                respondentPhone: null,
                respondentRelation:null,
                heirName: null,
                heirPhone: null,
                heirRelation:null,
                pot: null
            },   
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
            rules: {
            required: value => !!value || "*Required.",
            phoneNumberRule: value => {
                const isValidNumber = /^[79]\d{8}$/.test(value);
                return isValidNumber || 'Phone number must start with 9 or 7 and be a 9-digit number.';
            }
            // min: v => (v && v.length >= 8) || "Min 8 characters",
            },
        };
    },
    
    watch: {
        
      search(newValue) {
        // Check if the search input is empty
        if (newValue === "") {
          // If empty, display all User
          this.filteredUser = this.User;
        } else {
          // If not empty, filter the User based on the selected search column
          this.filteredUser = this.User.filter((student) => {
            const columnValue = student[this.searchColumn];
            return (
              columnValue &&
              columnValue.toString().toLowerCase().includes(newValue.toString().toLowerCase())
            );
          });
        }
      },
    },
    methods: {   
        
      setSnackbarMessage(_value){
        this.snackbar = true;
        this.snackBarText = _value
      },
        valueFormatter(key, value) {
            // You can add custom formatting logic here if needed
            return value;
        },       
        addPhoneNumber() {
            // Add a new empty phone number to the array
            this.phoneNumbers.push('');
        },

        removePhoneNumber(index) {
            // Remove the phone number at the specified index
            this.phoneNumbers.splice(index, 1);
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

        fetchUserRole() {
            const database = firebase.database();

            if (this.currentUser) {
                // alert(route.path)
                const currentUserEmail = this.currentUser.email;
                
                const sanitizedEmail = currentUserEmail.replace('@', '').replace('.', '');

                // Construct the path to the user in the "Users" database based on their UID
                const userPath = 'Users/' + sanitizedEmail;

                // Fetch the user permissions from the constructed path
                database.ref(userPath).on('value', (snapshot) => {
                const userPermissions = snapshot.val().role;
                this.selectedCode = snapshot.val().company;
                // alert(userPermissions);
                this.userRole = userPermissions;
                // alert(userPermissions);
                if (userPermissions == "Admin") {
                    this.userHasPermission = true;
                } else {
                    this.userHasPermission = false;
                    // this.$router.push('/')
                }
                });
            }
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
            // alert(User.name)
            this.newUser.pot = User.pot;
            this.newUser.id = User.id;
            this.newUser.email = User.email;
            this.newUser.name = User.name;
            this.newUser.phone = User.phone;
            this.newUser.age = User.age;
            this.newUser.gender = User.gender;
            this.newUser.city = User.city,
            this.newUser.subcity = User.subcity,
            this.newUser.woreda = User.woreda,
            this.newUser.houseNumber = User.houseNumber,
            this.newUser.respondentName = User.respondentName;
            this.newUser.respondentPhone = User.respondentPhone;
            this.newUser.respondentRelation = User.respondentRelation;
            this.newUser.heirName = User.heirName;
            this.newUser.heirPhone = User.heirPhone;
            this.newUser.heirRelation = User.heirRelation;
            this.showUserForm();
        },

        deleteUser(User) {
            this.confirmDeleteUser(User);
        },
        verifyUser(User) {
            this.confirmVerifyUser(User);
        },

        showAddUserForm() {
            // this.$refs.UserForm.reset();
            // this.addDialog = true;
            this.editUserMode = false;
            this.newUser = {
                pot: null,
                id: null,
                email: null,
                name: null,
                phone: null,
                age: null,
                gender: null,
                city: null,
                subcity: null,
                woreda: null,
                houseNumber: null,
                respondentName: null,
                respondentPhone: null,
                respondentRelation: null,
                heirName: null,
                heirPhone: null,
                heirRelation: null,
            };
            this.showUserForm();
        },

        showUserForm() {
            this.UserFormValid = false;
            this.addDialog = true;
        },

        closeUserForm() {
            this.addDialog = false;
            this.$refs.UserForm.reset();
            this.editUserMode = false;
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
            const minDD = parseInt(this.siteSettingsValues.mindd)
            const maxDD = parseInt(this.siteSettingsValues.maxdd)
            const maxDP = parseInt(this.siteSettingsValues.maxdp)
            const maxDW = parseInt(this.siteSettingsValues.maxdw)
            var serviceFee = parseInt(this.siteSettingsValues.sf)
            const penalityAmount = parseInt(this.siteSettingsValues.apm)
            
            const checkStatusRef = firebase.database().ref('Members').child(this.selectedMember.id);
            checkStatusRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    // console.log(this.daysAheadOfToday(lastDate)<(maxDW * -1));
                    if (this.daysAheadOfToday(lastDate)<(maxDW * -1)) {
                        this.setSnackbarMessage(`This user has been disallowed to deposit (${maxDW} days passed)`);
                        this.depositing = false;
                        return false
                    }
                    if (snapshot.val()['won'] == true) {
                        this.newDeposit.dailyContribution = this.siteSettingsValues.dca
                        this.alreadyWon = true
                        if (this.daysAheadOfToday(lastDate) < (maxDP * -1)) {
                            this.setSnackbarMessage(`This user has been penalized (${maxDP} days passed)`);
                            this.penalized = true
                            this.penalizedAmount = penalityAmount * this.daysAheadOfToday(lastDate) * -1
                        }
                    } else {
                        this.newDeposit.dailyContribution = this.siteSettingsValues.dcb
                        serviceFee = 0
                        this.alreadyWon = false              
                    }
                } 
                else {
                    this.newDeposit.dailyContribution = this.siteSettingsValues.dcb
                    this.alreadyWon = false
                    this.depositing = false;
                    this.setSnackbarMessage(`This user does not exist!`);
                    this.closeMemberInfo()
                    return false;
                    // console.log(this.siteSettingsValues.dcb);                
                }
            })
            if (!this.depositing) {
                return false
            }
            if (this.newDeposit.dailyContribution != null && this.newDeposit.amount != 0) {
                const amount = parseInt(this.newDeposit.amount)
                const dailyContribution = parseInt(this.newDeposit.dailyContribution)
                var totalLottoTogenerate = amount/dailyContribution
                var netAmount = amount;
                if (this.alreadyWon) {
                    totalLottoTogenerate = Math.floor((amount - this.penalizedAmount)/(dailyContribution + serviceFee))
                    netAmount = amount - this.penalizedAmount
                    console.log(totalLottoTogenerate);
                    console.log(netAmount);
                    // this.depositing = false
                    // return false;
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
                    
                    // Search for an object with rollNumber and currentLottoNumber
                    let searchedObject = this.lottoSettingsValues.find(obj => obj.pot === this.selectedMember.pot);
                    var currentRollNumber = null
                    var currentLottoNumber = null
                    if (searchedObject) {
                        console.log(searchedObject);
                        currentRollNumber = parseInt(searchedObject.rollNumber)
                        currentLottoNumber = parseInt(searchedObject.currentLottoNumber)
                    } else {
                        console.log('Object not found');
                        currentRollNumber = 0
                        currentLottoNumber = 0
                    }
                    this.totalLottoTogenerate = totalLottoTogenerate
                    if (currentRollNumber == currentLottoNumber || this.alreadyWon) {
                        this.depositing = await this.loopLottoUpdate(this.penalizedAmount, lastDate,totalLottoTogenerate,this.depositingRollNumber,currentRollNumber,this.selectedMember,netAmount - (serviceFee * totalLottoTogenerate),dailyContribution, this.currentUser);
                        this.closeMemberInfo()
                    }
                    else{
                        console.log('not equal');
                        this.depositing = false 
                    }

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
        async loopLottoUpdate(penalityAmount,lastDate,totalLottoTogenerate,depositingRollNumber,currentRollNumber,selectedMember,amount,dailyContribution, currentUser){
            try {
                const response = await fetch(`${this.siteSettingsValues.su}/update-lotto-setting`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        {
                            winner: this.alreadyWon,
                            penalityAmount: penalityAmount,
                            amount:amount, 
                            selectedMember:selectedMember, 
                            currentUser:currentUser, 
                            // formattedDate:formattedDate,
                            lastDate:lastDate, 
                            totalLottoTogenerate:totalLottoTogenerate, 
                            depositingRollNumber:depositingRollNumber,
                            currentRollNumber:currentRollNumber, 
                            dailyContribution:dailyContribution, 
                        }),
                })
                // if (response.status == 100) {
                    
                // }
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.setSnackbarMessage(data.message)
                if (data.success) {
                    return false
                }
                // console.log(data);
                
                
            } catch (error) {
                console.error('Error updating deposit:', error);
                this.setSnackbarMessage(error)
                return false
                
            }

                   
        },
        saveUser() {
            if (this.$refs.UserForm.validate()) {
                const database = firebase.database();

                if (this.editUserMode) {
                const updatedUserData = {
                    pot: this.newUser.pot,
                    email: this.newUser.email,
                    name: this.newUser.name,
                    phone: this.newUser.phone,
                    age: this.newUser.age,
                    gender: this.newUser.gender,
                    city: this.newUser.city,
                    subcity: this.newUser.subcity,
                    woreda: this.newUser.woreda,
                    houseNumber: this.newUser.houseNumber,
                    respondentName: this.newUser.respondentName,
                    respondentPhone: this.newUser.respondentPhone,
                    respondentRelation: this.newUser.respondentRelation,
                    heirName: this.newUser.heirName,
                    heirPhone: this.newUser.heirPhone,
                    heirRelation: this.newUser.heirRelation,
                    updatedAt: Date.now(),
                    updatedBy: firebase.auth().currentUser.email,
                };

                const UserRef = database.ref('Members').child(this.newUser.id);

                UserRef
                    .update(updatedUserData)
                    .then(() => {
                    //console.log('User updated in Firebase successfully.');
                    this.closeUserForm();
                    this.editUserMode = false;
                    this.filteredUser = this.User;
                    })
                    .catch((error) => {
                    console.error('Error updating User in Firebase:', error);
                    });
                } else {

                const sanitizedEmail = this.newUser.email.replace('@', '').replace('.', '');
                const newUserRef = database.ref('Members').child(sanitizedEmail);
                // const newUserKey = newUserRef.key;
                const newUserData = {
                    id: sanitizedEmail,
                    pot: this.newUser.pot,
                    email: this.newUser.email,
                    name: this.newUser.name,
                    phone: this.newUser.phone,
                    age: this.newUser.age,
                    gender: this.newUser.gender,
                    city: this.newUser.city,
                    subcity: this.newUser.subcity,
                    woreda: this.newUser.woreda,
                    houseNumber: this.newUser.houseNumber,
                    respondentName: this.newUser.respondentName,
                    respondentPhone: this.newUser.respondentPhone,
                    respondentRelation: this.newUser.respondentRelation,
                    heirName: this.newUser.heirName,
                    heirPhone: this.newUser.heirPhone,
                    heirRelation: this.newUser.heirRelation,
                    won: false,
                    online: false,
                    addedAt: Date.now(),
                    addedBy: firebase.auth().currentUser.email,
                };

                newUserRef
                    .set(newUserData)
                    .then(() => {
                        this.setSnackbarMessage (`Succesfully added ${newUserData.email}`)   
                        //console.log('User added to Firebase successfully.');
                        this.closeUserForm();
                        this.filteredUser = this.User;
                    })
                    .catch((error) => {
                        this.setSnackbarMessage (`Error adding User to Firebase: ${error}`) 
                    });
                }
            }
        },

        confirmDeleteUser(User) {
            this.UserToDelete = User;
            this.confirmDeleteDialog = true;
        },
        confirmVerifyUser(User) {
            this.UserToVerify = User
            this.confirmVerifyDialog = true;
        },

        confirmDelete() {
            if (this.UserToDelete) {
                const database = firebase.database();
                const UserRef = database.ref('Members').child(this.UserToDelete.id);

                UserRef
                .remove()
                .then(() => {
                    //console.log('User deleted from Firebase successfully.');
                    this.confirmDeleteDialog = false;
                    this.filteredUser = this.User.filter(
                    (User) => User.id !== this.UserToDelete.id
                    );
                })
                .catch((error) => {
                    console.error('Error deleting User from Firebase:', error);
                });
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
            Email: User.email,
            Phone: User.phone,
            Age: User.age,
            Gender: User.gender,
            City: User.city,
            Subcity: User.subcity,
            Woreda: User.woreda,
            "House Number": User.houseNumber,
            "Respondent Name": User.respondentName,
            "Respondent Phone": User.respondentPhone,
            "Respondent Relation": User.respondentRelation,
            "Heir Name": User.heirName,
            "Heir Phone": User.heirPhone,
            "Heir Relation": User.heirRelation,
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
        showAddForm() {
            this.addDialog = true; // Show the add User dialog
        },
        closeAddForm() {
        // Close the add User dialog and reset the form
        this.addDialog = false;
        this.$refs.UserForm.reset();

        this.newUser = {
                pot: null,
                id: null,
                email: null,
                name: null,
                phone: null,
                age: null,
                gender: null,
                city: null,
                subcity: null,
                woreda: null,
                houseNumber: null,
                respondentName: null,
                respondentPhone: null,
                respondentRelation: null,
                heirName: null,
                heirPhone: null,
                heirRelation: null,
            };
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