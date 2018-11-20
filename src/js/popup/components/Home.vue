<template>
  <!-- <popup-header
    page-title='Home'
  >
    <router-link
      class='create-new-story'
      to='/new'
      title='Create New Story'
    >
      <v-icon name='record' />
    </router-link>
  </popup-header> -->
  <md-app class='home normal-size' md-waterfall>
    <md-app-toolbar class='md-primary md-elevation-4 md-toolbar--header'>
      <div>
        <span class="md-title">Paipai</span>
        <!-- <md-button class='md-button--default-in-header'>Back</md-button> -->
      </div>
      <div>
        <md-button
          class='md-icon-button md-primary md-icon-button--common'
          v-on:click="addNewStory"
        >
          <i class="iconfont icon-add"></i>
        </md-button>
      </div>
    </md-app-toolbar>
    <md-app-content class='home-content'>
      <div class='list-container'>
        <md-list v-if='stories.length > 0'>
          <md-list-item
            class='home-list__item'
            v-for="story in stories"
          >
            <router-link :to='`/new/${story.id}`'>
              <md-button class='md-button--default-in-header'>
                {{ story.name }}
              </md-button>
            </router-link>
            <!--
            <span>
              {{ /*getApproximateTime(story.time)*/ }}
            </span>
            -->
            <span class='operation-list'>
              <!-- <router-link
                class='create-new-story'
                :to='`/display/${story.id}`'
                title='Show Story Details'
              >
                <md-button class='md-icon-button md-icon-button--common md-icon-button--gray'>
                  <i class="iconfont icon-edit"></i>
                </md-button>
              </router-link> -->
              <md-button
                class='md-icon-button md-icon-button--common md-icon-button--gray'
                v-on:click="deleteStory(story.id)"
              >
                <i class="iconfont icon-delete"></i>
              </md-button>
            </span>
          </md-list-item>
        </md-list>
        <section class='home-placeholder' v-else>
          <div class="home-placeholder_logo">
            <i class='iconfont icon-screenshot'></i>
          </div>
          <p class='home-placeholder_hint'>Please click blank space on this page after clicked button below, you could use 'XXX' as keyboard shortcuts to make screenshot</p>
          <md-button
            class='md-raised md-primary md-raised--create-new-btn'
            v-on:click='addNewStory'
          >CREATE A NEW PAIPAI</md-button>
        </section>
      </div>
    </md-app-content>
  </md-app>
</template>

<script>

import {getApproximateTime} from 'Utils';
import Head from 'Components/common/Head';
import api from 'Popup/backgroundApi';
import BackgroundProtocol from 'BackgroundProtocol';

export default {
  methods: {

    get: async function() {
      this.stories = await api.command(BackgroundProtocol.GET_STORY_LIST);
      console.log(this.stories)
    },

    getApproximateTime(time) {
      return getApproximateTime(time);
    },

    deleteStory: async function(id) {
      console.log('the id: ', id);
      await api.command(BackgroundProtocol.DELETE_STORY, id);
      this.get();
    },

    addNewStory: async function() {
      const newStoryId = await api.command(BackgroundProtocol.ADD_NEW_STORY);
      this.$router.push(`/new/${newStoryId}`);
    }

  },

  components: {
    'popup-header': Head
  },

  data () {
    return {
      stories: []
    }
  },

  mounted: async function() {
    this.get();
  }
}
</script>

<style lang="scss" scoped>
.home-content {
  padding: 0;
}

.home-list__item {
  position: relative;
  justify-content: space-around;

  &:after {
    content: '';
    position: absolute;
    width: calc( 100% - 30px );
    height: 1px;
    background: #f7f7f7;
    margin: 0 15px;
    left: 0;
    bottom: 0;
  }

  * {
    font-size: 24px;
  }
}

.home-placeholder {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  top: 50%;
  transform: translateY(-50%)
}

.home-placeholder_logo {
  color: #eff2f8;

  .iconfont {
    font-size: 100px;
  }
}

.home-placeholder_hint {
  color: #9aa5b9;
  padding: 0 30px;
  text-align: center
}

.md-raised--create-new-btn {
  width: 270px;
  height: 40px;

  .md-button-content {
    font-size: 15px;
  }
}
</style>
