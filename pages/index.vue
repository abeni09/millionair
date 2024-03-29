<template>
  <v-container>
    <!-- Dialog for adding User -->
    <v-dialog v-if="selectedMember != null" v-model="viewGeneratedReport" max-width="100%" persistent>
      <v-card >
        <v-row class = 'ma-1' style="background-color: aliceblue; margin-bottom: 1%;">
          <v-card-title class="headline centered-title">
            Report for {{ member }} ({{ batch_number }})
          </v-card-title>
        </v-row>
        <v-card-text>
          <v-row align="center">
            
            <v-col align="center" v-for="(card, index) in specificMemberCards" :key="index" cols="12" md="4" sm = '6'>
              
              <div class="card">
                  <div>
                      <div class="numbers">{{ card.countItems }}</div>
                      <div class="cardName">{{ card.title }}</div>
                  </div>

                  <!-- <div class="iconBx">
                      <v-icon class="md hydrated">{{ card.icon }}</v-icon>
                  </div> -->
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeReportViewer">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- <v-row></v-row> -->
    <v-row v-if="currentUser" class = 'ma-1'>

      <v-overlay v-if="loading">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-overlay>
      <!-- <v-card-title class="headline centered-title">
        Welcome {{ currentUser.email }}
      </v-card-title> -->
    </v-row>
    <v-row class="ma-1">
      <v-col align="center"
             cols="12"
             md="4"
             sm="6">
        <v-select
          outlined
          clearable
          dense
          v-model="batch_number"
          label="Batch"
          :items="potOptions"
        />
      </v-col>
      <v-spacer/>
      <v-col align="center"
             cols="12"
             md="4"
             sm="6">
        <v-select
        :disabled = 'batch_number == null'
          outlined
          clearable
          dense
          v-model="member"
          label="Members"
          :items="memberOptions"
        />
      </v-col>
      <v-spacer/>
      <v-col align="center"
             cols="12"
             md="4"
             sm="12">
        <v-btn :disabled="member == null" width = "100%" @click="generateReport" color="primary" v-if="!generating && !loading">View Report</v-btn>
        <v-progress-circular indeterminate color="success" size="50" v-else-if="generating"/>
      </v-col>
    </v-row>
    
    <!-- Dashboard Cards Grid -->
    <v-row v-if="!batch_number" align="center" class="ma-5">
      <v-col class="mt-1" align="center" v-for="(card, index) in dashboardCards" :key="index" cols="12" md="6" sm = '6'>
        <!-- <dash-card
          :iconStyle="card.icon"
          :dcolor="card.dcolor"
          :title="card.title"
          :countItems="card.countItems"
        /> -->
        <div class="card-main">
          <div class="card-block text-center">
          <v-icon size="50" color="rgb(23, 59, 13)" class="feather icon-mail text-c-lite-green d-block f-40">{{ card.icon }}</v-icon>
          <h3 class="mt-5"><span style="color: rgb(251, 197, 43); size: 30px;">{{ card.countItems }}</span>
          {{ card.title }}</h3>
          <!-- <p class="m-b-10">Your main list is growing</p> -->
          </div>
        </div>
      </v-col>
    </v-row>
        <!-- Dashboard Cards Grid -->
    <v-row v-else align="center" class="ma-5">
      <v-col class="mt-1" align="center" v-for="(card, index) in singleCard" :key="index" cols="12" md="12" sm = '12'>
        <!-- <dash-card
          :iconStyle="card.icon"
          :dcolor="card.dcolor"
          :title="card.title"
          :countItems="card.countItems"
        /> -->
        <div class="card-main">
          <div class="card-block text-center">
          <v-icon size="50" color="rgb(23, 59, 13)" class="feather icon-mail text-c-lite-green d-block f-40">{{ card.icon }}</v-icon>
          <h3 class="mt-5"><span style="color: rgb(251, 197, 43); size: 30px;">{{ card.countItems }}</span>
          {{ card.title }}</h3>
          <!-- <p class="m-b-10">Your main list is growing</p> -->
          </div>
        </div>
      </v-col>
    </v-row>
    <!-- Dashboard Cards Grid -->
    <v-row class="ma-10" v-if="batch_number == null" align="center">
      <v-col align="center">
        <v-text class="headline">NO POT SELECTED</v-text>
      </v-col>
    </v-row>
    <v-row v-else align="center">
      <v-col align="center" v-if="potDataLoading">
        <v-progress-circular indeterminate color="success" size="50"/>
      </v-col>
      <v-col v-if="!potDataLoading" align="center" v-for="(card, index) in dashboardPotCards" :key="index" cols="12" md="4" sm = '6'>
        
        <div class="card">
            <div>
                <div class="numbers">{{ card.countItems }}</div>
                <div class="cardName">{{ card.title }}</div>
            </div>

            <!-- <div class="iconBx">
                <v-icon class="md hydrated">{{ card.icon }}</v-icon>
            </div> -->
        </div>
      </v-col>
    </v-row>
  </v-container>

</template>

<script>
import DashCard from '../components/Dashboard/DashCard.vue'
import DashCardForReport from '../components/Dashboard/DashCardForReport.vue'
import { format } from 'date-fns';
import { writeFile, utils } from 'xlsx';
import jwt from 'jsonwebtoken';
export default {

  // props: {
  //   // Receive userHasPermission as a prop
  //   userHasPermission: {
  //     type: Boolean,
  //     default: false,
  //   },
  // },
  computed: {
    dashboardCards() {
      return [
        { dcolor: "rgb(23, 59, 13)", title: "Pots", icon:"mdi-pot", countItems: this.numberOfPots },
        { dcolor: "rgb(23, 59, 13)", title: "Members", icon:"mdi-account", countItems: this.totalMembers },
      ];
    },
    singleCard() {
      return [
        { dcolor: "rgb(23, 59, 13)", title: `Total Members For Batch ${this.batch_number}`, icon:"mdi-pot", countItems: this.totalMembersPerPot },
      ];
    },
    dashboardPotCards() {
      return [
        { title: "How many people can the money an individual, that has already been lucky, contributes a day reach (paid) to?", icon:"mdi-pot", countItems: this.q0},
        { title: "How many people can the money all individual(s), that has already been lucky, contribute a day reach (paid) to?", icon:"mdi-pot", countItems: this.q1},
        { title: "How many people can the money an individual, that is yet to be lucky, contributes a day reach (paid) to?", icon:"mdi-pot", countItems: (this.siteSettings.deposit_contribution_before/this.totalNonWinnerMembersPerPot/this.siteSettings.daily_win_amount).toExponential(3)},
        { title: "How many people can the money all individual(s), that is yet to be lucky, contribute a day reach (paid) to?", icon:"mdi-pot", countItems: (((parseInt(this.siteSettings.deposit_contribution_before) * this.totalNonWinnerMembersPerPot)/this.totalNonWinnerMembersPerPot)/parseInt(this.siteSettings.daily_win_amount)).toExponential(3)},
        { title: "How many people can the money all individual(s) contribute a day reach (paid) to?", icon:"mdi-pot", countItems: ((((parseInt(this.siteSettings.deposit_contribution_before) * this.totalNonWinnerMembersPerPot) + (parseInt(this.siteSettings.deposit_contribution_after) * this.totalWinnerMembersPerPot))/this.totalNonWinnerMembersPerPot)/parseInt(this.siteSettings.daily_win_amount)).toExponential(3)},
        { title: "How many days left to finish?", icon:"mdi-account", countItems: (this.totalNonWinnerMembersPerPot/parseInt(this.siteSettings.daily_number_of_winners).toExponential(3)) },
        { title: "How much money left to finish?", icon:"mdi-account", countItems: (this.totalNonWinnerMembersPerPot * parseInt(this.siteSettings.daily_win_amount)).toExponential(3) },
        { title: "How much money collected so far from contribution?", icon:"mdi-account", countItems: this.totalDepositPerPot},
        { title: "How much money payed so far for those who got lucky?", icon:"mdi-account", countItems: this.totalWinnerMembersPerPot * parseInt(this.siteSettings.daily_win_amount) },
        
      ];
    },
    specificMemberCards() {
      const cards = [
        { won:false, title: "How many days left until this individual gets lucky?", icon:"mdi-pot", countItems: ((parseInt(this.siteSettings.daily_win_amount) - this.selectedMemberBeforeDeposit)/this.siteSettings.deposit_contribution_before).toExponential(3)},
        { won:false, title: "How much money this individual must pay to get lucky?", icon:"mdi-pot", countItems: (parseInt(this.siteSettings.daily_win_amount) - this.selectedMemberBeforeDeposit).toExponential(3)},
        { won:true, title: "How many days has this individual been contributing before getting lucky?", icon:"mdi-pot", countItems: (this.selectedMemberBeforeDeposit/this.siteSettings.deposit_contribution_before).toExponential(3)},
        { won:true, title: "How much money has this individual contributed before getting lucky?", icon:"mdi-pot", countItems: this.selectedMemberBeforeDeposit},
        { won:true, title: "How many days has this individual left to finish contributing after getting lucky?", icon:"mdi-pot", countItems: ((parseInt(this.siteSettings.daily_win_amount) - this.selectedMemberTotalDeposit)/this.siteSettings.deposit_contribution_after).toExponential(3)},
        { won:true, title: "How much money is this individual left to finish contributing after getting lucky?", icon:"mdi-account", countItems: parseInt(this.siteSettings.daily_win_amount) - this.selectedMemberTotalDeposit },
      ];
      return cards.filter(card=> card.won == this.selectedMember.won)
    }
  },
  watch: {

    batch_number: 'fetchDataForSelectedPot',
    member: 'fetchDataForSelectedMember',

  },
  components: { DashCard , DashCardForReport},
  name: 'IndexPage',
  data(){
    return{
      q0: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      q5: 0,
      q6: 0,
      q7: 0,
      q8: 0,
      totalMembers: 0,
      totalMembersPerPot: 0,
      totalWinnerMembersPerPot: 0,
      totalNonWinnerMembersPerPot: 0,
      // specificShared: 0,
      days: 0,
      potDataLoading: false,
      batch_number:null,
      member:null,
      company:null,
      // today:null,
      status:null,
      winStatus:null,
      specificReportResponse:null,
      potOptions:[],
      memberOptions:[],
      selectedMember:null,
      selectedMemberDeposit:[],
      selectedMemberTotalDeposit:null,
      selectedMemberBeforeDeposit:null,
      selectedMemberAfterDeposit:null,
      originalMemberOptions:[],
      winnerMembers:[],
      stillToWinMembers:[],
      deposits:[],
      filteredDeposits:[],
      totalDepositPerPot:0,
      numberOfPots:0,
      siteSettings:null,
      lottoSettings:[],
      durationOptions:['Daily','Weekly','Monthly'],
      // database: firebase.database(),
      generating : false,
      viewGeneratedReport: false,
      currentUser:null,
      userHasPermission:false,
      loading: true,
      token:null
    }

  },
  mounted(){
    
    this.token = localStorage.getItem('token');
    const settingToken = localStorage.getItem('settings');
    console.log(settingToken);
    console.log(this.token);
    if (this.token && settingToken) {
      // Decode the JWT this.token to extract user information
      const decodedToken = jwt.decode(this.token);
      this.siteSettings = JSON.parse(settingToken)
      this.numberOfPots = this.siteSettings.batch_amount
      if (decodedToken && this.siteSettings) {
        // this.$store.dispatch('auth/login', decodedToken);
        this.currentUser = decodedToken
        if (decodedToken.role == 'Admin') {
          this.userHasPermission = true;
        }
        else{
          this.userHasPermission = false
        }
        
        if (this.siteSettings.batch_amount) {
            for (let index = 1; index < parseInt(this.siteSettings.batch_amount)+1; index++) {
                this.potOptions.push(index)
            }
            console.log(this.potOptions);
        }
        else{
            console.log("pots unavailable");
        }
        // this.fetchMembers()
        this.fetchMembersCount()
        this.loading = false
        // this.fetchDeposits()

      } else {
        console.log('Invalid JWT this.token.');
        if (!decodedToken) {
          this.$store.dispatch('auth/logout')          
        }
      }
    } else {
      console.log('JWT this.token not found.');
      if (!this.token) {
        this.$store.dispatch('auth/logout')          
      }
    }
  },
  
  methods:{

    async fetchMembers(){
            this.loading = true;
            try {
                // const response = await fetch(`${this.siteSettings.server_url}/fetchMembers`, {
                const response = await fetch(`${this.siteSettings.server_url}/fetchMembers`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.originalMemberOptions = data.members;
                this.totalMembers = this.originalMemberOptions.length                
                
            } catch (error) {
                console.error('Error fetching members:', error);
                this.setSnackbarMessage(error)
                // return false
                
            }
            // this.loading = false;
        },
    async fetchDeposits(){
            this.loading = true;
            try {
                const response = await fetch(`${this.siteSettings.server_url}/fetchDeposits`, {
                // const response = await fetch(`${this.siteSettingsValues.su}/fetchMembers`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
              // console.log(data.Deposits);
              this.deposits = data.deposits;               
                
            } catch (error) {
                console.error('Error fetching members:', error);
                this.setSnackbarMessage(error)
                // return false
                
            }
            this.loading = false;
        },
    
    async fetchMembersCount(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchMembersCount`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.totalMembers = data.count;
        
      } catch (error) {
        console.error('Error updating deposit:', error);
        this.setSnackbarMessage(error)
        return false
    
      }
    },
    async fetchMembersCountForBatch(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchMembersCount/${this.batch_number}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.totalMembersPerPot = data.count;
        
      } catch (error) {
        console.error('Error updating deposit:', error);
        this.setSnackbarMessage(error)
        return false
    
      }
    },
    async fetchMembersForBatch(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchMembers/${this.batch_number}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.originalMemberOptions = data.members;
        this.memberOptions = this.originalMemberOptions
          .map(sale => ({
            text: `${sale.name} (${sale.age})`,
            value: sale.id,
          }));
        
      } catch (error) {
        console.error(`Error fetching members for batch ${batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    async fetchWinnerMembersCountForBatch(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchMembersCount/${this.batch_number}/${true}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.totalWinnerMembersPerPot = data.count;
      } catch (error) {
        console.error(`Error fetching members for batch ${batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    async fetchNonWinnerMembersCountForBatch(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchMembersCount/${this.batch_number}/${false}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.totalNonWinnerMembersPerPot = data.count;
      } catch (error) {
        console.error(`Error fetching members for batch ${batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    async fetchTotalDepositForBatch(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchDepositSum/${this.batch_number}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.totalDepositPerPot = data.totalAmount;
      } catch (error) {
        console.error(`Error fetching totla deposit for batch ${batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },

    async fetchTotalExpiredDepositForSelectedMember(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchDepositSum/${this.batch_number}/${true}/${this.selectedMember.id}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.selectedMemberBeforeDeposit = data.totalAmount;
      } catch (error) {
        console.error(`Error fetching totla deposit for batch ${this.batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    async fetchTotalNotExpiredDepositForSelectedMember(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchDepositSum/${this.batch_number}/${false}/${this.selectedMember.id}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.selectedMemberAfterDeposit = data.totalAmount;
      } catch (error) {
        console.error(`Error fetching totla deposit for batch ${this.batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    async fetchTotalTotalDepositForSelectedMember(){
      
      try {
        const response = await fetch(`${this.siteSettings.server_url}/fetchDepositSum/${this.batch_number}/${this.selectedMember.id}`, {
        // const response = await fetch(`${this.siteSettings.server_url}/searchMembers/${column}/${keyword}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        this.selectedMemberTotalDeposit = data.totalAmount;
      } catch (error) {
        console.error(`Error fetching totla deposit for batch ${this.batch_number}:`, error);
        this.setSnackbarMessage(error)
        return false

      }
    },
    fetchDataForSelectedMember(){
      if (this.member != null) {
      this.potDataLoading = true
      
      if (this.originalMemberOptions.length != 0) {
        this.selectedMember = this.originalMemberOptions.filter(newMember => newMember.id == this.member && newMember.batch_number == this.batch_number)[0]
        // console.log(this.selectedMember);
        if (this.selectedMember != null) {
          this.winStatus = this.selectedMember.won
          this.fetchTotalTotalDepositForSelectedMember()
          this.fetchTotalExpiredDepositForSelectedMember()
          this.fetchTotalNotExpiredDepositForSelectedMember()

        }
      }
      
      this.potDataLoading = false
        
      }
    },
    fetchDataForSelectedPot() {
      if (this.batch_number != null) {
        this.potDataLoading = true
        this.member = null
        this.fetchMembersCountForBatch()
        this.fetchTotalDepositForBatch()
        this.fetchWinnerMembersCountForBatch()
        this.fetchNonWinnerMembersCountForBatch()
        this.fetchMembersForBatch()
        this.q0 = (this.siteSettings.deposit_contribution_after/(this.totalNonWinnerMembersPerPot * this.siteSettings.daily_win_amount)).toExponential(3)
        this.q1 = ((parseInt(this.siteSettings.deposit_contribution_after) * this.totalWinnerMembersPerPot)/(this.totalNonWinnerMembersPerPot) * parseInt(this.siteSettings.daily_win_amount)).toExponential(3)
        this.potDataLoading = false
        
      }
    },
    getStatusColor(status) {
      return status
    },
    closeReportViewer(){
      this.viewGeneratedReport = false
      this.specificReportResponse = null
      if (this.userHasPermission) {
        this.batch_number = null
      }
      // this.pot = null
      this.selectedMember = null
      this.member = null
      // this.duration = null
      this.generating = false
      this.days = 0
      // this.today = null
      this.status = null
    },
    // fetchMemberUsingID(memberID){
    //   this.database.ref('Member').child(memberID).once('value',snapshot=>{
    //     return `${snapshot.val().name} (${snapshot.val().phone})`
    //   })
    // },
    exportToExcel(generatedReport) {
      // Prepare data for export (use filteredUser instead of User)
      const data = generatedReport.map(User => ({
        "Phone Number":`+251${User.phone}`,
        Member: User.name,
        Pot: User.batch_number,
        Date: User.date,
        Status: User.status.toUpperCase(),
      }));

      // Create a worksheet
      const ws = utils.json_to_sheet(data);

      // Create a workbook
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Member");

      // Export the workbook to a file
      writeFile(wb, "Member.xlsx");
    },
    generateReport(){
      this.generating = true
   
      this.generating = false
      this.viewGeneratedReport = true
  
    },
    calculateDaysBefore(days){
      // Get the current date
      const currentDate = new Date();

      // Calculate yesterday's date
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - days);

      // Get the timestamp for yesterday
      const timestampYesterday = yesterday.getTime();

      return(this.formatDate(timestampYesterday));
    },
    formatDate(timestamp) {
      return format(new Date(timestamp), 'MMMddyyyy');
    },

    // fetchSiteSettings(){
    //   this.siteSettings = []
    //   this.database.ref('Settings/SiteSetting').once('value',snapshot=>{
    //     if (snapshot.exists()) {
    //       this.siteSettings = snapshot.val()
    //       this.numberOfPots = parseInt(this.siteSettings.pot)
    //     }
    //     this.fetchPots()
    //     // snapshot.forEach(element => {
    //     //   this.siteSettings.push(element.val())
    //     // });
    //     console.log("Site Settings fetched");
    //     // this.loading = false
    //   })
    // },
    // fetchLottoSettings(){
    //   this.lottoSettings = []
    //   this.database.ref('Settings/LottoSetting').once('value',snapshot=>{
    //     snapshot.forEach(element => {
    //       const elementVal = element.val();
    //       elementVal.pot = element.key
    //       this.lottoSettings.push(elementVal)
    //     });
    //     console.log("Lotto Settings fetched");
    //     console.log(this.lottoSettings);
    //     // this.loading = false
    //   })
    // },
  }}

</script>
<style scoped>
.card{
  visibility: inherit;
    --blue: #2a2185;
    --white: #fff;
    --gray: #f5f5f5;
    --black1: #222;
    --black2: #999;
    font-family: "Ubuntu", sans-serif;
    margin: 0;
    box-sizing: border-box;
    position: relative;
    background: var(--white);
    padding: 30px;
    border-radius: 20px;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    box-shadow: 0 7px 25px rgba(0, 0, 0, 0.08);
}
.cardName{
  visibility: inherit;
    --blue: #2a2185;
    --white: #fff;
    --gray: #f5f5f5;
    --black1: #222;
    --black2: #999;
    cursor: pointer;
    font-family: "Ubuntu", sans-serif;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    color: var(--black2);
    font-size: 1.1rem;
    margin-top: 5px;
}
.hydrated{
  --blue: #2a2185;
    --white: #fff;
    --gray: #f5f5f5;
    --black1: #222;
    --black2: #999;
    cursor: pointer;
    font-size: 3.5rem;
    color: var(--black2);
    display: inline-block;
    width: 1em;
    height: 1em;
    contain: strict;
    fill: currentcolor;
    box-sizing: content-box !important;
    font-family: "Ubuntu", sans-serif;
    margin: 0;
    padding: 0;
    visibility: inherit;
}
.iconBx{
  visibility: inherit;
    --blue: #2a2185;
    --white: #fff;
    --gray: #f5f5f5;
    --black1: #222;
    --black2: #999;
    cursor: pointer;
    font-family: "Ubuntu", sans-serif;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-size: 3.5rem;
    color: var(--black2);
}
.numbers{
  visibility: inherit;
    --blue: #2a2185;
    --white: #fff;
    --gray: #f5f5f5;
    --black1: #222;
    --black2: #999;
    cursor: pointer;
    font-family: "Ubuntu", sans-serif;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    position: relative;
    font-weight: 500;
    font-size: 2.5rem;
    color: var(--blue);
}
.card-main{
  -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    --blue: #007bff;
    --indigo: #6610f2;
    --purple: #6f42c1;
    --pink: #e83e8c;
    --red: #dc3545;
    --orange: #fd7e14;
    --yellow: #ffc107;
    --green: #28a745;
    --teal: #20c997;
    --cyan: #17a2b8;
    --white: #fff;
    --gray: #6c757d;
    --gray-dark: #343a40;
    --primary: #007bff;
    --secondary: #6c757d;
    --success: #28a745;
    --info: #17a2b8;
    --warning: #ffc107;
    --danger: #dc3545;
    --light: #f8f9fa;
    --dark: #343a40;
    --breakpoint-xs: 0;
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
    --font-family-sans-serif: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
    --font-family-monospace: SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
    font-weight: 400;
    line-height: 1.5;
    text-align: left;
    font-size: .875em;
    color: #353c4e;
    font-family: open sans,sans-serif;
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border-radius: 5px;
    box-shadow: 0 1px 20px 0 rgba(69,90,100,.08);
    border: none;
    margin-bottom: 30px;
}
</style>
