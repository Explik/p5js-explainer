<template>
    <div>
      <h1>Explanation Page</h1>
      <p>Explanation page for item with ID: {{ id }}</p>
      <router-link to="/">Back to Navigation</router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: "Details",
    props: ['id'],
    computed: {
      id() {
        return this.$route.params.id;
      }
    }
  };
  </script>