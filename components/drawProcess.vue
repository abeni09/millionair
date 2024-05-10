<template>
  <v-card>
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
    <template>
      <div class="container">
        <div class="content">
          <p>Draw stopping in: {{ formattedTime }}</p>
        </div>
      </div>
    </template>
    <v-progress-circular class="my-2" v-if="stopping" style="width: 100%; margin: auto; color: #183D0E; " align = "center" indeterminate/>
                           
    <VBtn v-else class="my-2 gradient" style="background-color: #183D0E; color: #FFC72C;"
               @click="startDraw" block min-height="44">
                  Emergency Stop
                </VBtn>
    <vTabs background-color= "#183D0E" v-model="activeTab" dark>
      <v-tab v-for="(tab, index) in tabs" :key="index">
        {{ tab.tab }}
      </v-tab>
    </vTabs>

    <vTabs-items v-model="activeTab">
      <v-tab-item v-for="(tab, index) in tabs" :key="index">
        <v-card flat>
            <v-list v-if="tab.contents.length > 0">
              
              <v-list-item v-for="(item, idx) in tab.contents" :key="idx">
                <v-list-item-icon>
                  <v-icon v-if="item.used" color = "green" size="30" style="align-self: center;">mdi-check</v-icon>
                  <v-icon v-else-if="!item.expired && !item.used" color = "yellow" size="30" style="align-self: center;">mdi-help</v-icon>
                  <v-icon v-else-if="item.expired" color = "red" size="30" style="align-self: center;">mdi-close</v-icon>
                </v-list-item-icon>
                
                <v-list-item-avatar>
                  <v-img
                    class="circular-image"
                    :src= composeProfileUrl(getMemberFromList(item.drawn_by)[6])
                    lazy-src="https://picsum.photos/id/11/100/60"
                    max-width="300"
                    max-height="300"
                  >
                    <template v-slot:placeholder>
                      <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                      >
                        <v-progress-circular
                          indeterminate
                          color="grey lighten-5"
                        ></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                </v-list-item-avatar>
                <!-- <v-list-item-title>{{ item.drawn_by }}</v-list-item-title> -->

                <!-- <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by) }}</v-list-item-subtitle> -->
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[0] }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[1] }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[2] }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[3] }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[4] }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ getMemberFromList(item.drawn_by)[5] }}</v-list-item-subtitle>
                <v-list-item-title>{{ item.used }}</v-list-item-title>
                <v-list-item-title>{{ item.timer }}</v-list-item-title>
              </v-list-item>
            </v-list>
        </v-card>
        
      </v-tab-item>
    </vTabs-items>
  </v-card>
    
</template>

<script>
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

export default {
  data() {
    return {
      time: 60,
      activeTab: null,
      items: [],
      members: [],
      settings: null,
      token: null,
      stopping: false,
      snackbar: false,
      snackBarText: '',
      timeout: 2000,
    };
  },
  computed: {
    tabs() {
      return this.items;
    },
    formattedTime() {
      const minutes = Math.floor(this.time / 60);
      const seconds = this.time % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
  },
  beforeDestroy() {
    this.stopTimer();
  },
  mounted() {
    this.listenToDrawerChanges();
    this.startTimer();
    const settingToken = localStorage.getItem('settings');
    // console.log(this.currentUser);
    this.settings = JSON.parse(settingToken)
    this.token = localStorage.getItem('token');
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        if (this.time > 0) {
          this.time--;
        } else {
          this.stopTimer();
          this.startDraw();
        }
      }, 1000); // Update every second
    },
    stopTimer() {
      clearInterval(this.timer);
    },
    setSnackbarMessage(_value){
        this.snackbar = true;
        this.snackBarText = _value
    }, 
    
    async startDraw() {
            this.stopping = true
            try {
                const response = await fetch(`${this.settings.server_url}/startDraw`, {
                // const response = await fetch(`http://localhost:3006/startDraw`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({drawstarted: false}),
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                localStorage.setItem('settings', JSON.stringify(data.setting))
                this.settings.drawstarted = data.setting.drawstarted
                this.setSnackbarMessage(data.message)
                this.stopping = false
                console.log(data.setting);
                
                
            } catch (error) {
                this.stopping = false
                console.error('Error starting draw:', error);
                this.setSnackbarMessage(error)
                
            }

        },
    composeProfileUrl(profile_pic){
      return `${this.settings.server_url}/uploads/${profile_pic}`;
    },
    getMemberFromList(id){
      const member = this.members.find(obj => obj.id === id);
      return [
        member.name ? member.name : 'Unknown', 
        member.phone ? member.phone: 'Unknown',
        member.batch_number ? member.batch_number : 'Unknown', 
        member.city ? member.city: 'Unknown',
        member.subcity ? member.subcity: 'Unknown',
        member.woreda ? member.woreda: 'Unknown',
        member.profile_pic ? member.profile_pic: 'Unknown',
      ];
    },
    async fetchMemberInfo(id){
      
        try {
            const response = await fetch(`${this.settings.server_url}/fetchMemberInfo/${id}`, {
            // const response = await fetch(`http://78.46.175.135:3006/fetchMemberInfo/${id}`, {
            // const response = await fetch(`http://localhost:3006/fetchMemberInfo/${id}`, {
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
            // console.log(data);
            if (data.memberInfo != null) {
              // Check if the memberInfo does not already exist in the members array
              if (!this.members.some(member => member.id === data.memberInfo.id)) {
                // If it doesn't exist, push it into the members array
                this.members.push(data.memberInfo);
              }

              console.log(this.members);
            }
            
        } catch (error) {
            console.error('Error fetching memberInfo:', error);
            // this.setSnackbarMessage(error)
            // return false
            
        }
    },
    listenToDrawerChanges() {
      const database = firebase.database();
      const drawRef = database.ref('Draw');
      const settingRef = database.ref('Settings/batch_amount');
      const timerRef = database.ref('Settings/draw_timeout');

      settingRef.once('value', snapshot => {
        const batchAmount = snapshot.val() || 0;
        for (let i = 0; i < batchAmount; i++) {
          this.items.push({ tab: `Batch ${i + 1}`, contents: [] });
        }
        this.activeTab = this.items[0]; // Set the active tab
      });
      timerRef.once('value', snapshot => {
        const timer = snapshot.val() || 0;
        this.time = timer * 60
      });
      drawRef.on('value', snapshot => {
        // Clear the existing contents array
        this.items.forEach(item => {
          item.contents = [];
        });

        snapshot.forEach(childSnapshot => {
          const batchNumber = childSnapshot.val().batch_number;
          if (batchNumber >= 1 && batchNumber < this.items.length) {
            this.items[batchNumber - 1].contents.push(childSnapshot.val());
            this.fetchMemberInfo(childSnapshot.key); // Fetch member info
          }
        });
      });

    },
  },
};
</script>

<style scoped>
.circular-image {
  border-radius: 25%;
}
</style>
