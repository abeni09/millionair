<template>
    <v-card
      class="ma-1 lighten-1 white--text"
      flat
      :color="dcolor"
      width="210"
      min-height="90"
    >
      <v-row>
        <v-col class="align-center" cols = 12>
          <v-row>
            <v-col align = "center" cols = 12><v-icon size="30"> {{ iconStyle }} </v-icon></v-col>
            <v-col align = "center" cols = 12>{{ title }}</v-col>
          </v-row>
        </v-col>
        <v-col cols = '12' :color="dcolor" style="list-style: none; font-weight: bolder; font-size:25px;">
          {{ countItems }}
        </v-col>
        <!-- <v-col cols = '12' :color="dcolor" style="list-style: none; font-weight: bolder; font-size:25px;">
          {{ percentage + '%' }}
        </v-col> -->
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
        // required: true,
        default: 'mdi-account',
      },
    },
  }
  </script>
  