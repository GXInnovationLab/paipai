<template>
  <div class='popup-header'>
    <div v-if='typeof backRoute === "string"' class="back-btn">
      <router-link :to='backRoute'>
        <v-icon name='back' />
        <span>{{backPageName}}</span>
      </router-link>

    </div>
    <center class='page-title' v-if='typeof pageTitle === "string"'>{{pageTitle}}</center>
    <div class='extensions'>
      <slot></slot>
    </div>
  </div>
</template>

<script>

import {getApproximateTime} from 'Utils';

export default {
  name: 'popup-header',
  props: [
    'backRoute',
    'backPageName',
    'pageTitle'
  ],
  data() {
    return {

    }
  }
}
</script>

<style scoped>
  .back-btn {
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
  }

  .back-btn a {
    text-decoration: none;
    display: flex;
    line-height: 12px;
  }

  .popup-header {
    position: relative;
    padding: 5px 10px;
    border-bottom: 1px solid #d5d5d5;
  }

  .page-title {
    font-size: 15px;
  }

  .extensions {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
