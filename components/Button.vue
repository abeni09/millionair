<template>
  <v-btn :width="width" @click="handleClick" color="primary">{{ label }}</v-btn>
</template>

<script>
  export default {
    props: {
      width: String,
      label: String,
    },
    methods: {
      handleClick() {
        this.$emit('click');
      },
    },
  };
</script>
