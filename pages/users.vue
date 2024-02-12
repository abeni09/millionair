<template>
  <div v-if="userHasPermission">
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
            <v-col align = "center" 
            cols="12"
            md="2"
            sm="2">
                <v-btn @click="showAddUserForm" style="background-color: #183D0E; color: #FFC72C;" v-if="userHasPermission">Add</v-btn>
            </v-col>
        </v-row>
      </div>
      <v-data-table :loading="loading"
          :headers="headers"
          :items="filteredUser"
          :search="search"
      >
          <template v-slot:item.actions="{ item }">
                  <v-btn fab small inline class="ma-1">
                  <v-icon color="green" @click="editUser(item)">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn fab small inline class="ma-1">
                  <v-icon color="red" @click="deleteUser(item)">mdi-delete</v-icon>
                  </v-btn>
          </template>
      </v-data-table>

      <!-- Add an export button -->
      <!-- <v-btn @click="exportToExcel" color="primary">Export to Excel</v-btn> -->
      

      <!-- Dialog for adding User -->
      <v-dialog v-model="addDialog" max-width="600px">
          <v-card>
              <v-card-title class="headline centered-title" style="background-color: aliceblue; margin-bottom: 1%;">
              {{ editUserMode ? 'Edit User' : 'Add User' }}
              </v-card-title>
              <v-card-text>
                  <v-form ref="UserForm" v-model="addFormValid" lazy-validation>        
                      <v-select
                          :rules="[rules.required]"
                          outlined
                          dense
                          v-model="newUser.role"
                          label="Role"
                          required
                          :items="roleOptions"
                          @change = "handleRoleChange"
                          ></v-select>
                      <v-text-field  
                                  :rules="[rules.required]" outlined dense v-model="newUser.name" label="Name" required></v-text-field>
                      <v-text-field 
                                  :rules="[rules.required, rules.email]" outlined dense v-model="newUser.email" label="Email" required></v-text-field>
                      <!-- <v-text-field 
                          v-if="showSupervisorSelect"
                                  :rules="[rules.required]" outlined dense v-model="newUser.phone" label="Phone" required></v-text-field> -->
                      <!-- <v-text-field 
                                  :rules="[rules.required]" outlined dense v-model="newUser.company" label="Max Competitors" required></v-text-field> -->
                      <!-- <v-text-field 
                          v-if="showSupervisorSelect"
                                  :rules="[rules.required]" outlined dense v-model="newUser.location" label="Location" required></v-text-field> -->
                      
                    <!-- <v-select
                        :rules="[rules.required]" 
                        v-if="showSupervisorSelect"
                        outlined
                        dense
                        required
                        v-model="newUser.company"
                        label="Company"
                        :items="companysOptions"
                    /> -->
                <!-- <v-select
                          v-if="showSupervisorSelect"
                          :disabled="editUserMode"
                          :rules="[rules.required]"
                          outlined
                          dense
                          v-model="newUser.supervisor"
                          label="Supervisor"
                          required
                          :items="supervisorOptions"
                          ></v-select>                  -->
                  </v-form>
              </v-card-text>
              <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closeAddForm">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="saveUser" :disabled="!addFormValid">Submit</v-btn>
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
      <v-dialog v-model="confirmCloseDialog" max-width="400px">
          <v-card>
          <v-card-title class="headline centered-title" style="background-color: #ff5722; margin-bottom: 1%;">
              Confirm Closing
          </v-card-title>
          <v-card-text>
              Are you sure you want to Close this User?
          </v-card-text>
          <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="cancelClose">NO</v-btn>
              <v-btn color="red darken-1" text @click="confirmClose">YES</v-btn>
          </v-card-actions>
          </v-card>
      </v-dialog>
  </div>
</template>

<script>
import { writeFile, utils } from 'xlsx';
import { subDays } from 'date-fns';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { format } from 'date-fns';

export default {
  // validations: {
  //     newUser: UserValidations,
  // },
  mounted() {
      
      firebase.auth().onAuthStateChanged(user => {
          this.currentUser = user
          if(this.currentUser){
            this.fetchUserRole();
          }
          // alert(this.currentUser.uid)
          // Fetch user permissions from Firebase database when the component mounts
      })
    //   this.fetchCompanys()
      // this.fetchUser()
      const database = firebase.database();
      const UserRef = database.ref('Users');
      const supervisorsRef = database.ref('Supervisors');

      UserRef
      // .orderByChild('status').equalTo('Open')
      .on('value', snapshot => {
        if (snapshot.exists()) {
            this.User = [];
            snapshot.forEach(childSnapshot => {
                const User = childSnapshot.val();
                // if (User.updatedAt) {
                //     User.updatedAt = this.formatDate(User.updatedAt)                    
                // }
                if (User.addedAt) {
                    User.addedAt = this.formatDate(User.addedAt) 
                }
                // if (User.closedAt) {
                //     User.closedAt = this.formatDate(User.closedAt)
                // }
                
                this.User.push(User);
                // alert(User.updatedAt)
                this.filteredUser = this.User
                console.log(this.filteredUser);
            });
            // this.User.forEach(element => {
            //     console.log(element.email);
            //     if (element.email == firebase.auth().currentUser.email) {
            //         this.userHasPermission = element.role == "Admin"
            //     }
            // });
            this.loading = false
            
        }
        else{
            this.User = []
            this.loading = false
        }
      });
      this.loading = false;
  },
  data() {
      return {
          companysOptions:["MEET Pharmacy","MEET Doctors","Tele Doctors","Tele Lawyers","Tele Automotive"],
          showSupervisorSelect:false,
          currentUser:null,
          userHasPermission: false,
          loading:true,
          minDate: subDays(new Date(), 1), // Set the minimum date to one day before today
          searchColumn: "name",
          User: [],
          search: "",
          filteredUser: [], // Filtered User based on search
          supervisorOptions: [],
          roleOptions: ["Admin", "Agent", "Banker"],
          database: firebase.database(),
          headers: [
              { text: 'Name', value: 'name' },
              { text: 'Email', value: 'email' },
              { text: 'Role', value: 'role' },
              { text: 'Added', value: 'addedAt' },
              { text: '', value: 'actions', sortable: false },
          ],
          confirmDeleteDialog: false,
          confirmCloseDialog: false, 
          editUserMode: false,
          addDialog: false, // Flag to control the display of the add User dialog
          addFormValid: false, // Flag to track the validity of the add User form
          newUser: {
              name: "",
              phone: null,
              email: null,
              company: null,
              location: null,
              role:null
          },
          rules: {
          required: value => !!value || "*Required.",
          email: (value) =>
            /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value) ||
            'Invalid email',
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
    fetchCompanys(){
      this.database.ref('OriginalData').on('value',snapshot=>{
        this.companysOptions = []
        snapshot.forEach(element => {
            this.companysOptions.push(element.key);
        });
      })
    },  
    
    handleRoleChange() {
      // Show Supervisor v-select only when the selected role is "Sales"
      this.showSupervisorSelect = this.newUser.role != "Admin";
      // alert(this.showSupervisorSelect);
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
          // alert(userPermissions);
          if (userPermissions == "Admin") {
            this.userHasPermission = true;
          } else {
            this.userHasPermission = false;
            this.$router.push('/')
          }
        });
      }
    },
      formatDate(timestamp) {
          return format(new Date(timestamp), 'MMM dd, yyyy');
          // return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
      },
      editUser(User) {
          this.editUserMode = true;
        //   alert(User.company)
          this.newUser.name = User.name;
          this.newUser.email = User.email;
          this.newUser.id = User.id;
          this.newUser.role = User.role;
          if(this.newUser.role == "Supervisor"){
            this.newUser.phone = User.phone;
            this.newUser.company = User.company;
            this.newUser.location = User.location;
            this.showSupervisorSelect = true

          }
          else if(this.newUser.role == "Admin"){
            this.newUser.phone = null;
            this.newUser.location = null;
            this.showSupervisorSelect = false

          }
          this.showUserForm();
          // alert(User.id)
      },

      deleteUser(User) {
          this.confirmDeleteUser(User);
      },
      closeUser(User) {
          this.confirmCloseUser(User);
      },

      showAddUserForm() {
          this.editUserMode = false;
          this.newUser = {
              name: "",
              phone: null,
              email: null,
              company: null,
              location: null,
              role:null
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

      saveUser() {
          if (this.$refs.UserForm.validate()) {
              const database = firebase.database();

              if (this.editUserMode) {
              const updatedUserData = {
                  name: this.newUser.name,
                  phone: this.newUser.phone,
                  email: this.newUser.email,
                  company: this.newUser.company,
                  location: this.newUser.location,
                  role: this.newUser.role,
                  updatedAt: Date.now(),
                  updatedBy: this.currentUser.uid,
              };

              const UserRef = database.ref('Users').child(this.newUser.id);
              // alert(UserRef)

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
              const newUserData = {
                  name: this.newUser.name,
                  phone: this.newUser.phone,
                  email: this.newUser.email.toLowerCase(),
                  company: this.newUser.company,
                  location: this.newUser.location,
                  role: this.newUser.role,
                  // currentRound: 1,
                  addedAt: Date.now(),
                  addedBy: this.currentUser.uid,
              };
              const sanitizedEmail = this.newUser.email.toLowerCase().replace('@', '').replace('.', '');
              const newUserRef = database.ref(`Users/${sanitizedEmail}`);
              newUserRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    alert("User with the same email already registered")
                }
                else{
                    const newUserKey = newUserRef.key;

                    newUserData.id = newUserKey;

                    newUserRef
                        .set(newUserData)
                        .then(() => {
                        //console.log('User added to Firebase successfully.');
                        this.closeUserForm();
                        this.filteredUser = this.User;
                        })
                        .catch((error) => {
                        console.error('Error adding User to Firebase:', error);
                        });
                }
              })
              }
          }
      },

      confirmDeleteUser(User) {
          this.UserToDelete = User;
          this.confirmDeleteDialog = true;
      },
      confirmCloseUser(User) {
          this.UserToClose = User;
          this.confirmCloseDialog = true;
      },

      confirmDelete() {
          if (this.UserToDelete) {
              const database = firebase.database();
              const UserRef = database.ref('Users').child(this.UserToDelete.id);

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

      // Function to close the delete confirmation dialog
      closeDeleteDialog() {
        this.confirmDeleteDialog = false;
        this.UserToDelete = null;
      },
      confirmClose() {
          if (this.UserToClose) {
              const database = firebase.database();
              const UserRef = database.ref('User').child(this.UserToClose.id);

              UserRef.update({status: 'Closed', closedAt: Date.now(),}).then(() => {
                  this.confirmCloseDialog = false;
              })
              .catch((error) => {
                  console.error('Error closing User:', error);
              });
          }
      },
      // Function to cancel the delete action
      cancelClose() {
        this.closeCloseDialog();
      },

      // Function to close the delete confirmation dialog
      closeCloseDialog() {
        this.confirmCloseDialog = false;
        this.UserToClose = null;
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
      showAddForm() {
      this.newUser = {
          name: null,
          phone: null,
          location: null,
          email: null,
          role:null,
      };
          this.addDialog = true; // Show the add User dialog
      },
      closeAddForm() {
      // Close the add User dialog and reset the form
      this.addDialog = false;
      this.$refs.UserForm.reset();
      this.newUser = {
          name: "",
          phone: null,
          location: null,
          email: null,
          role:null,
      };
      },
  },
};
</script>
