<template>
  <div v-if="userHasPermission">
      <div style="display: flex; margin: auto" class="my-5" >
            <v-row>
                <v-col align = "center" cols = "4">
                    <v-select
                    outlined
                    dense
                    v-model="searchColumn"
                    :items="headers"
                    label="Column"
                    />
                </v-col>
                <v-col align = "center" cols = "8">
                    <v-text-field dense outlined v-model="search" append-icon="mdi-magnify" label="Search" single-line />
                </v-col>
            </v-row>
          <!-- <v-btn @click="showAddForm" color="success">Add</v-btn> -->
      </div>
      <v-data-table :loading="loading"
          :headers="headers"
          :items="filteredsupervisor"
          :search="search"
      >
        <template v-slot:item.actions="{ item }">
            <v-btn :disabled = "item.closedAt != null" fab small inline class="ma-1">
            <v-icon color="green" @click="editsupervisor(item)">mdi-pencil</v-icon>
            </v-btn>
            <v-btn fab small inline class="ma-1">
            <v-icon color="red" @click="deletesupervisor(item)">mdi-delete</v-icon>
            </v-btn>
        </template>
          <!-- <template v-slot:item="{ item }">
              <tr>
              <td>{{ item.name }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.location }}</td>
              <td v-if="item.addedAt">{{ item.addedAt }}</td>
              <td v-else> - </td>
              <td>
                  <v-btn :disabled = "item.closedAt != null" fab small inline class="ma-1">
                  <v-icon color="green" @click="editsupervisor(item)">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn fab small inline class="ma-1">
                  <v-icon color="red" @click="deletesupervisor(item)">mdi-delete</v-icon>
                  </v-btn>
              </td>
              </tr>
          </template> -->
      </v-data-table>

      <!-- Add an export button -->
      <!-- <v-btn @click="exportToExcel" color="primary">Export to Excel</v-btn> -->
      

      <!-- Dialog for adding supervisor -->
      <v-dialog v-model="addDialog" max-width="600px">
          <v-card>
              <v-card-title class="headline centered-title" style="background-color: aliceblue; margin-bottom: 1%;">
              {{ editsupervisorMode ? 'Edit Supervisor' : 'Add Supervisor' }}
              </v-card-title>
              <v-card-text>
                  <v-form ref="supervisorForm" v-model="addFormValid" lazy-validation>
                      <v-text-field 
                                  :rules="[rules.required]" outlined dense v-model="newsupervisor.name" label="Name" required></v-text-field>
                      <v-text-field 
                                  :rules="[rules.required]" outlined dense v-model="newsupervisor.phone" label="Phone" required></v-text-field>
                      <!-- <v-text-field 
                                  :rules="[rules.required]" outlined dense v-model="newsupervisor.maxCompetitors" label="Max Competitors" required></v-text-field> -->
                      <v-text-field
                                  :rules="[rules.required]" outlined dense v-model="newsupervisor.location" label="Location" required></v-text-field>
                       <!-- <v-select
                          :disabled="editsupervisorMode"
                          :rules="[rules.required]"
                          outlined
                          dense
                          v-model="newsupervisor.supervisor"
                          label="Supervisor"
                          required
                          :items="supervisorOptions"
                          ></v-select> -->
                  <!-- <v-row>
                          <v-col cols="6">
                              <v-date-picker 
                                  :rules="[rules.required]" :min="minDate.toISOString().substr(0, 10)" v-model="newsupervisor.startDate" label="Start Date" required></v-date-picker>
                          </v-col>
                          <v-spacer/>
                          <v-col cols="6">
                              <v-date-picker 
                                  :rules="[rules.required]" :min="minDate.toISOString().substr(0, 10)" v-model="newsupervisor.endDate" label="End Date" required></v-date-picker>
                          </v-col>
                      </v-row> -->
                  </v-form>
              </v-card-text>
              <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closeAddForm">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="savesupervisor" :disabled="!addFormValid">Submit</v-btn>
              </v-card-actions>
          </v-card>
      </v-dialog>
          
      <v-dialog v-model="confirmDeleteDialog" max-width="400px">
          <v-card>
          <v-card-title class="headline centered-title" style="background-color: #ff5722; margin-bottom: 1%;">
              Confirm Deletion
          </v-card-title>
          <v-card-text>
              Are you sure you want to delete this supervisor?
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
              Are you sure you want to Close this supervisor?
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
  //     newsupervisor: supervisorValidations,
  // },
  mounted() {
      
      firebase.auth().onAuthStateChanged(user => {
          this.currentUser = user
          // Fetch user permissions from Firebase database when the component mounts
          this.fetchUserRole();
      })
      // this.fetchsupervisor()
      const database = firebase.database();
      const supervisorRef = database.ref('Users');
      // const supervisorsRef = database.ref('supervisors');

      supervisorRef
      // .orderByChild('status').equalTo('Open')
      .on('value', snapshot => {
          this.supervisor = [];
          snapshot.forEach(childSnapshot => {
            const supervisor = childSnapshot.val();
            if (supervisor.role == "Supervisor") {
                if (supervisor.addedAt) {
                    supervisor.addedAt = this.formatDate(supervisor.addedAt) 
                }
                // if (supervisor.closedAt) {
                //     supervisor.closedAt = this.formatDate(supervisor.closedAt)
                // }
                
                this.supervisor.push(supervisor);
                // alert(supervisor.updatedAt)
                this.filteredsupervisor = this.supervisor
                console.log(this.filteredsupervisor);
                
            }
          });
      });
      // supervisorsRef
      // // .orderByChild('status').equalTo('Open')
      // .on('value', snapshot => {
      //     snapshot.forEach(childSnapshot => {
      //         const supervisor = childSnapshot.val().name;
      //         this.supervisorOptions.push(supervisor);
      //     });
      // });
      this.loading = false;
  },
  data() {
      return {
          currentUser:null,
          userHasPermission: false,
          loading:true,
          minDate: subDays(new Date(), 1), // Set the minimum date to one day before today
          searchColumn: "name",
          supervisor: [],
          search: "",
          filteredsupervisor: [], // Filtered supervisor based on search
          supervisorOptions: [],
          headers: [
            { text: 'Name', value: 'name' },
            { text: 'Phone Number', value: 'phone' },
            { text: 'Location', value: 'location' },
            { text: 'Added', value: 'addedAt' },
            { text: '', value: 'actions', sortable: false }
          ],
          confirmDeleteDialog: false,
          confirmCloseDialog: false, 
          editsupervisorMode: false,
          addDialog: false, // Flag to control the display of the add supervisor dialog
          addFormValid: false, // Flag to track the validity of the add supervisor form
          newsupervisor: {
              name: "",
              phone: null,
              // maxCompetitors: null,
              location: "",
              supervisor:null
          },
          rules: {
          required: value => !!value || "*Required.",
          // min: v => (v && v.length >= 8) || "Min 8 characters",
          },
      };
  },
  
  watch: {
      
    search(newValue) {
      // Check if the search input is empty
      if (newValue === "") {
        // If empty, display all supervisor
        this.filteredsupervisor = this.supervisor;
      } else {
        // If not empty, filter the supervisor based on the selected search column
        this.filteredsupervisor = this.supervisor.filter((student) => {
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
      editsupervisor(supervisor) {
          this.editsupervisorMode = true;
          // alert(supervisor.name)
          this.newsupervisor.name = supervisor.name;
          this.newsupervisor.phone = supervisor.phone;
          // this.newsupervisor.maxCompetitors = supervisor.maxCompetitors;
          this.newsupervisor.location = supervisor.location;
          this.newsupervisor.supervisor = supervisor.supervisor;
          this.newsupervisor.id = supervisor.id;
          this.showsupervisorForm();
      },

      deletesupervisor(supervisor) {
          this.confirmDeletesupervisor(supervisor);
      },
      closesupervisor(supervisor) {
          this.confirmClosesupervisor(supervisor);
      },

      showAddsupervisorForm() {
          this.editsupervisorMode = false;
          this.newsupervisor = {
              name: "",
              phone: "",
              // maxCompetitors: "",
              location: "",
              supervisor: null
          };
          this.showsupervisorForm();
      },

      showsupervisorForm() {
          this.supervisorFormValid = false;
          this.addDialog = true;
      },

      closesupervisorForm() {
          this.addDialog = false;
          this.$refs.supervisorForm.reset();
          this.editsupervisorMode = false;
      },

      savesupervisor() {
          if (this.$refs.supervisorForm.validate()) {
              const database = firebase.database();

              if (this.editsupervisorMode) {
              const updatedsupervisorData = {
                  name: this.newsupervisor.name,
                  phone: this.newsupervisor.phone,
                  location: this.newsupervisor.location,
                  updatedAt: Date.now(),
              };

              const supervisorRef = database.ref('Supervisors').child(this.newsupervisor.id);

              supervisorRef
                  .update(updatedsupervisorData)
                  .then(() => {
                  //console.log('supervisor updated in Firebase successfully.');
                  this.closesupervisorForm();
                  this.editsupervisorMode = false;
                  this.filteredsupervisor = this.supervisor;
                  })
                  .catch((error) => {
                  console.error('Error updating supervisor in Firebase:', error);
                  });
              } else {
              const newsupervisorData = {
                  name: this.newsupervisor.name,
                  phone: this.newsupervisor.phone,
                  location: this.newsupervisor.location,
                  supervisor: this.newsupervisor.supervisor,
                  // currentRound: 1,
                  addedAt: Date.now(),
              };

              const newsupervisorRef = database.ref('Supervisors').push();
              const newsupervisorKey = newsupervisorRef.key;

              newsupervisorData.id = newsupervisorKey;

              newsupervisorRef
                  .set(newsupervisorData)
                  .then(() => {
                  //console.log('supervisor added to Firebase successfully.');
                  this.closesupervisorForm();
                  this.filteredsupervisor = this.supervisor;
                  })
                  .catch((error) => {
                  console.error('Error adding supervisor to Firebase:', error);
                  });
              }
          }
      },

      confirmDeletesupervisor(supervisor) {
          this.supervisorToDelete = supervisor;
          this.confirmDeleteDialog = true;
      },
      confirmClosesupervisor(supervisor) {
          this.supervisorToClose = supervisor;
          this.confirmCloseDialog = true;
      },

      confirmDelete() {
          if (this.supervisorToDelete) {
              const database = firebase.database();
              const supervisorRef = database.ref('Supervisors').child(this.supervisorToDelete.id);

              supervisorRef
              .remove()
              .then(() => {
                  //console.log('supervisor deleted from Firebase successfully.');
                  this.confirmDeleteDialog = false;
                  this.filteredsupervisor = this.supervisor.filter(
                  (supervisor) => supervisor.id !== this.supervisorToDelete.id
                  );
              })
              .catch((error) => {
                  console.error('Error deleting supervisor from Firebase:', error);
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
        this.supervisorToDelete = null;
      },
      confirmClose() {
          if (this.supervisorToClose) {
              const database = firebase.database();
              const supervisorRef = database.ref('Supervisors').child(this.supervisorToClose.id);

              supervisorRef.update({status: 'Closed', closedAt: Date.now(),}).then(() => {
                  this.confirmCloseDialog = false;
              })
              .catch((error) => {
                  console.error('Error closing supervisor:', error);
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
        this.supervisorToClose = null;
      },
      exportToExcel() {
      // Prepare data for export (use filteredsupervisor instead of supervisor)
      const data = this.filteredsupervisor.map(supervisor => ({
          Name: supervisor.name,
          Location: supervisor.location,
          Phone: supervisor.phone,
          // Supervisor: supervisor.supervisor,
          // 'Total Students': supervisor.totalStudents,
          'Added At': supervisor.addedAt,
          // "Maximum Competitors": supervisor.maxCompetitors,
      }));

      // Create a worksheet
      const ws = utils.json_to_sheet(data);

      // Create a workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "supervisor");

      // Export the workbook to a file
      writeFile(wb, "supervisor.xlsx");
      },
      showAddForm() {
          this.addDialog = true; // Show the add supervisor dialog
      },
      closeAddForm() {
      // Close the add supervisor dialog and reset the form
      this.addDialog = false;
      this.$refs.supervisorForm.reset();
      this.newsupervisor = {
          name: "",
          phone: null,
          location: "",
          supervisor:null
      };
      },
  },
};
</script>
