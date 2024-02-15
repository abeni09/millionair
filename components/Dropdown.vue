<template>
    <v-row>
      <v-col>
        <v-select outlined dense :items="options" :disabled="disabled" :label="DropDownLabel" v-model="selectedOption"></v-select>
      </v-col>
    </v-row>
  </template>

  <script>
  export default {
    props: {
      disabled: Boolean,
      options: Array,
      selectedOption: String,
      DropDownLabel: String,
    },
  };
  </script>
