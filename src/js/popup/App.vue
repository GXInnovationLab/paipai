<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import backgroundProtocol from 'BackgroundProtocol';
import api from 'Popup/backgroundApi';
import router from './router';

export default {
  name: 'App',
  mounted: async function() {
    // const msg = {
    //   command: backgroundProtocol.GET_STATUS_URL
    // }

    const route = await api.command(backgroundProtocol.GET_STATUS_URL);
    route && router.push(route);
  }
}

</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}
</style>
