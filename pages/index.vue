<template>
  <v-container>
    <!-- Dialog for adding User -->
    <v-dialog v-model="viewGeneratedReport" max-width="600px" persistent>
      <v-card>
        <v-row class = 'ma-1' style="background-color: aliceblue; margin-bottom: 1%;">
          <v-card-title class="headline centered-title">
            {{duration}} Generated Report for {{ pot }} {{ member }} {{ company }} {{  '(' + today + ')' }}
          </v-card-title>
        </v-row>
        <v-card-text>
          <v-row align="center" v-if="specificReportResponse.length == 0">
            <v-card-title>No result found</v-card-title>
          </v-row>
          <v-row align="center" v-else-if="specificReportResponse.length != 0">
            <v-card-title class="headline centered-title">
              Status: <span :style="{ color: getStatusColor(status) }">{{ status }}</span>
            </v-card-title>
            <v-spacer/>
            <v-btn v-if="userHasPermission && specificReportResponse" @click="exportToExcel(specificReportResponse)" color="primary">Export to Excel</v-btn>
            <v-row class="ma-5">
              <v-col align="center" cols = "6">
                <div>
                  <dash-card-for-report :percentage = "(specificRegistered/specificReport * 100).toFixed(2)" dcolor="green" title="Registered" :countItems="specificRegistered"
                  />
                </div>
              </v-col>
              <v-col align="center" cols = "6">
                <div>
                  <dash-card-for-report :percentage = "(specificPast/specificReport * 100).toFixed(2)" dcolor="grey" title="Past" :countItems="specificPast"
                  />
                </div>
              </v-col>
              <v-col align="center" cols = "6">
                <div>
                  <dash-card-for-report :percentage = "(specificShared/specificReport * 100).toFixed(2)" dcolor="red" title="Shared" :countItems="specificShared"
                  />
                </div>
              </v-col>
              <v-col align="center" cols = "6">
                <div>
                  <dash-card-for-report :percentage = "(specificNotRegistered/specificReport * 100).toFixed(2)" dcolor="red" title="Not Registered" :countItems="specificNotRegistered"
                  />
                </div>
              </v-col>
              <v-col align="center" cols = "6">
                <div>
                  <dash-card-for-report :percentage = "(specificOkStop/specificReport * 100).toFixed(2)" dcolor="red" title="Ok/Stop" :countItems="specificOkStop"
                  />
                </div>
              </v-col>
            </v-row>

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
          v-model="pot"
          label="Pots"
          :items="potOptions"
        />
      </v-col>
      <v-spacer/>
      <v-col align="center"
             cols="12"
             md="4"
             sm="6">
        <v-select
        :disabled = 'pot == null'
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
    <v-row align="center" class="ma-5">
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
    <v-row class="ma-10" v-if="pot == null" align="center">
      <v-col align="center">
        <v-text class="headline">NO POT SELECTED</v-text>
      </v-col>
    </v-row>
    <v-row v-else-if="pot != null" align="center">
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
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { format } from 'date-fns';
import { writeFile, utils } from 'xlsx';
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
    dashboardPotCards() {
      return [
        { title: "How many people can the money an individual, that has already been lucky, contributes a day reach (paid) to?", icon:"mdi-pot", countItems: (parseInt(this.siteSettings.dca)/this.stillToWinMembers.length)/parseInt(this.siteSettings.dwa)},
        { title: "How many people can the money all individual(s), that has already been lucky, contribute a day reach (paid) to?", icon:"mdi-pot", countItems: ((parseInt(this.siteSettings.dca) * this.winnerMembers.length)/this.stillToWinMembers.length)/parseInt(this.siteSettings.dwa)},
        { title: "How many people can the money an individual, that is yet to be lucky, contributes a day reach (paid) to?", icon:"mdi-pot", countItems: (parseInt(this.siteSettings.dcb)/this.stillToWinMembers.length)/parseInt(this.siteSettings.dwa)},
        { title: "How many people can the money all individual(s), that is yet to be lucky, contribute a day reach (paid) to?", icon:"mdi-pot", countItems: ((parseInt(this.siteSettings.dcb) * this.stillToWinMembers.length)/this.stillToWinMembers.length)/parseInt(this.siteSettings.dwa)},
        { title: "How many people can the money all individual(s) contribute a day reach (paid) to?", icon:"mdi-pot", countItems: (((parseInt(this.siteSettings.dcb) * this.stillToWinMembers.length) + (parseInt(this.siteSettings.dca) * this.winnerMembers.length))/this.stillToWinMembers.length)/parseInt(this.siteSettings.dwa)},
        { title: "How many days left to finish?", icon:"mdi-account", countItems: this.stillToWinMembers.length/parseInt(this.siteSettings.dnw) },
        { title: "How much money left to finish?", icon:"mdi-account", countItems: this.stillToWinMembers.length * parseInt(this.siteSettings.dwa) },
        { title: "How much money collected so far from contribution?", icon:"mdi-account", countItems: this.totalDepositPerPot},
        { title: "How much money payed so far for those who got lucky?", icon:"mdi-account", countItems: this.winnerMembers.length * parseInt(this.siteSettings.dwa) },
        
      ];
    }
  },
  watch: {
    pot: 'fetchDataForSelectedPot',
  },
  components: { DashCard , DashCardForReport},
  name: 'IndexPage',
  data(){
    return{
      totalMembers: 0,
      totalPots: 0,
      totalRegistered: 0,
      totalReport: 0,
      totalNotRegistered: 0,
      totalPast: 0,
      totalOkStop: 0,
      totalShared: 0,
      specificReport: 0,
      specificRegistered: 0,
      specificNotRegistered: 0,
      specificPast: 0,
      specificOkStop: 0,
      specificShared: 0,
      days: 0,
      potDataLoading: false,
      pot:null,
      member:null,
      company:null,
      duration: "Daily",
      today:null,
      status:null,
      specificReportResponse:[],
      potOptions:[],
      memberOptions:[],
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
      database: firebase.database(),
      generating : false,
      viewGeneratedReport: false,
      currentUser:null,
      userHasPermission:false,
      loading: true,
    }

  },
  mounted(){
    firebase.auth().onAuthStateChanged(async user => {
      this.currentUser = user
      const database = firebase.database();
      if(this.currentUser){
        const currentUserEmail = this.currentUser.email;

        const sanitizedEmail = currentUserEmail.replace('@', '').replace('.', '');

        // Construct the path to the user in the "Users" database based on their UID
        const userPath = 'Users/' + sanitizedEmail;
        // Fetch the user permissions from the constructed path
        database.ref(userPath).on('value', (snapshot) => {
          // alert(snapshot.val())
          const userPermissions = snapshot.val().role;
          // alert(userPermissions);
          this.userRole = userPermissions;
          // alert(userPermissions);
          if (userPermissions == "Admin") {
            this.userHasPermission = true;
            // alert(this.userHasPermission)
          } else {
            this.userHasPermission = false;
            this.pot = sanitizedEmail
            this.company = snapshot.val().company
          }
        })

        database.ref('Members').on('value',snapshot=>{
          this.totalMember = 0,
            this.originalMemberOptions = []
          snapshot.forEach(element => {
            database.ref('Members').child(element.key).child('Deposit').once('value',snap=>{
              if (snap.exists()) {
                snap.forEach(deposit => {
                  const newDeposit = {
                    pot: element.val().pot,
                    amount: deposit.val().amount,
                  };
                  this.deposits.push(newDeposit)

                })
                
              }
            })
            // if (this.userHasPermission) {

              this.originalMemberOptions.push(element.val());
            // }
            this.totalMembers = this.totalMembers + 1
          });
          console.log("Member fetched");
        })
      }
      this.fetchReports()
      // this.fetchCompanys()
      this.fetchSiteSettings()
      this.fetchLottoSettings()
      // this.fetchPots()
      // this.fetchMember()

      // alert(this.userHasPermission)
    })
    // console.log(this.userHasPermission),
    // alert(this.userHasPermission)


  },
  methods:{
    fetchDataForSelectedPot() {
      this.potDataLoading = true
      this.memberOptions = []
      this.member = null
      this.filteredDeposits = []
      this.totalDepositPerPot = 0
      this.winnerMembers = []
      this.stillToWinMembers = []
      
      // Filter membersOptions based on the selected pot
      if (this.originalMemberOptions.length != 0) {
        this.memberOptions = this.originalMemberOptions
          .filter(sale => sale.pot === this.pot)
          .map(sale => ({
            text: `${sale.name} (${sale.phone})`,
            value: sale.id,
          }));
        this.filteredDeposits = this.deposits
          .filter(deposit => deposit.pot === this.pot)
          this.filteredDeposits.forEach(element => {
            this.totalDepositPerPot = this.totalDepositPerPot + parseInt(element.amount)
          });
        this.winnerMembers = this.originalMemberOptions
          .filter(sale => sale.pot === this.pot && sale.won == true)
        this.stillToWinMembers = this.originalMemberOptions
          .filter(sale => sale.pot === this.pot && sale.won != true)
        
      }
      // Replace this with your actual logic
      console.log(`Fetching data for pot: ${this.filteredDeposits[0].amount}`);
      this.potDataLoading = false
      // console.log(this.memberOptions);
    },
    getStatusColor(status) {
      return status
    },
    closeReportViewer(){
      this.viewGeneratedReport = false
      this.specificReportResponse = []
      if (this.userHasPermission) {
        this.pot = null
      }
      // this.pot = null
      this.member = null
      // this.duration = null
      this.generating = false
      this.days = 0
      this.today = null
      this.status = null
      this.totalReport = 0
      this.specificReport = 0
      this.specificRegistered = 0
      this.specificNotRegistered = 0
      this.specificOkStop = 0
      this.specificShared = 0
      this.specificPast = 0
    },
    // fetchMemberUsingID(memberID){
    //   this.database.ref('Member').child(memberID).once('value',snapshot=>{
    //     return `${snapshot.val().name} (${snapshot.val().phone})`
    //   })
    // },
    exportToExcel(generatedReport) {
      // Prepare data for export (use filteredUser instead of User)
      const data = generatedReport.map(User => ({
        "Phone Number":`+251${User.PhoneNumber}`,
        Member: User.MemberName,
        Company: User.company,
        Pot: User.pot,
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
      this.specificReportResponse = []
      // if (this.duration != null) {
      switch (this.duration) {
        case "Daily":
          this.days = 1
          break;

        case "Weekly":
          this.days = 7
          break;

        case "Monthly":
          this.days = 30
          break;

        default:
          this.days = 1
          break;
      }
      const todaysDate = this.formatDate(Date.now())
      this.today = todaysDate
      // alert(today)
      const currentUserEmail = this.currentUser.email;
      const sanitizedEmail = currentUserEmail.replace('@', '').replace('.', '');
      if (!this.userHasPermission) {
        this.pot = sanitizedEmail
      }
      this.fetchSpecificReport(this.today, this.pot, this.member, this.company)
      for (let index =1 ; index < this.days; index++) {
        // alert(this.calculateDaysBefore(index))
        this.fetchSpecificReport(this.calculateDaysBefore(index), this.pot, this.member, this.company)

      }
      console.log(this.specificReportResponse.length);
      if (this.specificReportResponse.length != 0) {
        const array = this.specificReportResponse
        for (let index = 0; index < array.length; index++) {
          const element = array[index];
          // alert(element.status)
          switch (element.status) {
            case 'registered':
              this.specificRegistered = this.specificRegistered + 1
              this.specificReport = this.specificReport + 1
              break;
            case 'not registered':
              this.specificReport = this.specificReport + 1
              this.specificNotRegistered = this.specificNotRegistered + 1
              break;
            case 'past':
              this.specificReport = this.specificReport + 1
              this.specificPast = this.specificPast + 1
              break;
            case 'shared':
              this.specificReport = this.specificReport + 1
              this.specificShared = this.specificShared + 1
              break;
            case 'ok/stop':
              this.specificReport = this.specificReport + 1
              this.specificOkStop = this.specificOkStop + 1
              break;

            default:
              break;
          }

        }
      }
      this.generating = false
      this.viewGeneratedReport = true
      // } else {
      //     this.generating = false

      // }
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

    fetchSpecificReport(datePath, pot, member, company){
      this.database.ref('Report').once('value',snapshot=>{
        snapshot.forEach(element => {
          const elementVal = element.val();
          // Check conditions only if pot and member are not null
          if ((!pot || elementVal.pot.toLowerCase() == pot) &&
            (!member || elementVal.Member == member) &&
            (!company || elementVal.company == company) &&
            elementVal.date == datePath) {
            this.specificReportResponse.push(elementVal);
          }
        });
      })
    },
    fetchSiteSettings(){
      this.siteSettings = []
      this.database.ref('Settings/SiteSetting').once('value',snapshot=>{
        if (snapshot.exists()) {
          this.siteSettings = snapshot.val()
          this.numberOfPots = parseInt(this.siteSettings.pot)
        }
        this.fetchPots()
        // snapshot.forEach(element => {
        //   this.siteSettings.push(element.val())
        // });
        console.log("Site Settings fetched");
        this.loading = false
      })
    },
    fetchLottoSettings(){
      this.lottoSettings = []
      this.database.ref('Settings/LottoSetting').once('value',snapshot=>{
        snapshot.forEach(element => {
          const elementVal = element.val();
          elementVal.pot = element.key
          this.lottoSettings.push(elementVal)
        });
        console.log("Lotto Settings fetched");
        console.log(this.lottoSettings);
        this.loading = false
      })
    },

    fetchReports(){
      this.database.ref('Report').on('value',snapshot=>{
        this.totalRegistered = 0,
          this.totalNotRegistered = 0,
          this.totalPast = 0,
          this.totalShared = 0,
          this.totalOkStop = 0,
          snapshot.forEach(element => {
            if (element.val().status == "not registered") {
              this.totalNotRegistered = this.totalNotRegistered + 1
              this.totalReport = this.totalReport + 1
            }
            else if (element.val().status == "registered") {
              this.totalReport = this.totalReport + 1
              this.totalRegistered = this.totalRegistered + 1
            }
            else if (element.val().status == "past") {
              this.totalReport = this.totalReport + 1
              this.totalPast = this.totalPast + 1
            }
            else if (element.val().status == "shared") {
              this.totalReport = this.totalReport + 1
              this.totalShared = this.totalShared + 1
            }
            else if (element.val().status == "ok/stop") {
              this.totalReport = this.totalReport + 1
              this.totalOkStop = this.totalOkStop + 1
            }
          });
        console.log("Report fetched");
      })
    },
    fetchPots(){
      // alert(this.numberOfPots)
      if (this.numberOfPots != 0) {
        for (let i = 1; i < this.numberOfPots + 1; i++) {
          const element = `Pot ${i}`;
          this.potOptions.push(element)
          
        }
      }
    },
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
