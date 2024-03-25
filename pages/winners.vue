<template>
    <!-- <div v-if="userHasPermission"> -->
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
              md="4"
              sm="4">
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
              <!-- <v-col align = "center" 
              cols="12"
              md="2"
              sm="2">
                  <v-btn @click="showAddUserForm" style="background-color: #183D0E; color: #FFC72C;" v-if="userHasPermission">Add</v-btn>
              </v-col> -->
          </v-row>
        </div>
        <v-data-table :loading="loading"
            :headers="headers"
            :items="filteredUser"
            :search="search"
        >
            <template v-slot:item.actions="{ item }">
                    <v-btn fab small inline class="ma-1">
                    <v-icon color="green" @click="showUserForm">mdi-information</v-icon>
                    </v-btn>
            </template>
        </v-data-table>
  
        <!-- Add an export button -->
        <!-- <v-btn @click="exportToExcel" color="primary">Export to Excel</v-btn> -->
        
  
        <!-- Dialog for adding User -->
        <v-dialog v-model="addDialog" max-width="600px">
            <v-card>
            <v-card-title class="headline">
                Winner Information <v-icon color="green" >mdi-check-decagram</v-icon>
            </v-card-title>

            <v-card-text>
                <!-- <v-list>
                <v-list-item-group>
                    <v-list-item v-for="(value, key) in memberFields" :key="key" v-if="selectedMember[key]">
                    <v-list-item-content>
                        <v-list-item-title>
                        <strong>{{ value }}:</strong> {{ valueFormatter(key, selectedMember[key]) }}
                        </v-list-item-title>
                    </v-list-item-content>
                    </v-list-item>
                </v-list-item-group>
                </v-list> -->
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeMemberInfo">Close</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
  </template>
  
  <script>
  import { writeFile, utils } from 'xlsx';
  import { subDays } from 'date-fns';
  import { format } from 'date-fns';
  import jwt from 'jsonwebtoken';
  
  export default {
    // validations: {
    //     newUser: UserValidations,
    // },
    mounted() {
      
      const token = localStorage.getItem('token');
      const settingToken = localStorage.getItem('serverURL');
      if (token) {
        // Decode the JWT token to extract user information
        const decodedToken = jwt.decode(token);
      //   const settingToken = jwt.decode(siteSettings);
        console.log(settingToken);
        if (decodedToken) {
          // this.$store.dispatch('auth/login', decodedToken);
          this.currentUser = decodedToken
          if (decodedToken.role == 'Admin') {
              // this.server_url = decodedToken.
              this.userHasPermission = true;
          }
          else{
              this.userHasPermission = false
          }
          if (!this.userHasPermission) {
              this.$router.push('/')
          }
          else{
              if (settingToken) {
                  this.server_url = settingToken  
                  this.fetchWinners()
                  this.loading = false              
              } else {
                  console.log('Invalid setting token.');
                  this.$store.dispatch('auth/logout')
                  
              }
  
          }
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
            snackBarText:'',
            timeout: 2000,
            snackbar:false,
            server_url: null,
            currentUser:null,
            userHasPermission: false,
            loading:true,
            minDate: subDays(new Date(), 1), // Set the minimum date to one day before today
            searchColumn: "name",
            User: [],
            search: "",
            filteredUser: [], // Filtered User based on search
            headers: [
                { text: 'Draw ID', value: 'draw_id' },
                { text: 'Lotto Number', value: 'lotto_number' },
                { text: 'Won Amount', value: 'won_amount' },
                { text: '', value: 'actions', sortable: false },
            ],
            addDialog: false,
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
      
      async fetchWinners(){
              this.loading = true;
              try {
                  // const response = await fetch(`http://localhost:3006/fetchWinners`, {
                  const response = await fetch(`${this.server_url}/fetchWinners`, {
                      method: 'GET',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                  })
                  // if (response.status == 100) {
                      
                  // }
                  if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                  }
  
                  const data = await response.json();
                  // console.log(data.users);
                  this.User = data.users;
  
                  this.filteredUser = this.User;
                  this.setSnackbarMessage(data.message)
                  // console.log(data);
                  
                  
              } catch (error) {
                  console.error('Error fetching users:', error);
                  this.setSnackbarMessage(error)
                  // return false
                  
              }
              this.loading = false;
          },
        setSnackbarMessage(_value){
            this.snackbar = true;
            this.snackBarText = _value
        },  
  
        showUserForm() {
            this.addDialog = true;
        },
  
        closeUserForm() {
            this.addDialog = false;
        },
  
        exportToExcel() {
            // Prepare data for export (use filteredUser instead of User)
            const data = this.filteredUser.map(User => ({
                Name: User.name,
                Email: User.email,
                Location: User.location,
                Phone: User.phone,
                Role: User.role,
                // 'Total Students': User.totalStudents,
                'Added At': User.addedAt,
                // "Maximum Competitors": User.company,
        }));
  
        // Create a worksheet
        const ws = utils.json_to_sheet(data);
  
        // Create a workbook
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "User");
  
        // Export the workbook to a file
        writeFile(wb, "User.xlsx");
        },
    },
  };
  </script>
  