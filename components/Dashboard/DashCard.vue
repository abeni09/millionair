<template>
    <v-card
      style="color: rgb(251, 197, 43);"
      class="equal-card pa-5"
      flat
      :color="dcolor"
    >
      <v-row>
        <v-spacer/>
        <v-row align="center">
          
          <v-col align = "center" cols = 12><v-icon size="60" color="white"> {{ iconStyle }} </v-icon></v-col>
        </v-row>
        <v-row align="center">
        <v-col cols = '12' style="list-style: none; font-weight: bolder; font-size:30px;">
          {{ countItems }}
        </v-col>
            <v-col cols = 12>{{ title }}</v-col>

        </v-row>
        <v-spacer/>
      </v-row>
    </v-card>
  </template>
  
  <script>
  export default {
    props: {
      title: {
        required: true,
        default: 'title',
      },
      dcolor: {
        required: true,
        default: 'grey',
      },
      countItems: {
        required: true,
        default: 0,
      },
      // percentage: {
      //   required: true,
      //   default: 0,
      // },
      iconStyle: {
        required: true,
        default: 'mdi-account',
      },
    },
  }
  </script>
  <style scoped>
  .equal-card {
    width: 200px; /* Adjust the width as per your requirement */
    /* height: 100%; Adjust the height as per your requirement */
  }
  </style>