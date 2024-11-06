<template>
    <v-app class="app">
        <v-main>
            <router-view></router-view>
        </v-main>
        <AppFooter />
    </v-app>
</template>

<script setup>
    import AppFooter from './components/AppFooter.vue';
</script>

<style scoped>
    .app {
        background: rgb(215,177,0);
        background: linear-gradient(90deg, rgba(215,177,0,1) 0%, rgba(201,67,0,1) 27%, rgba(173,74,57,1) 48%, rgba(130,28,28,1) 100%);
        min-height: 100vh;
    }
</style>