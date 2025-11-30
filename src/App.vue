<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="['QueryRegistration']">
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
