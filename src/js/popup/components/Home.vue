<template>
  <div class='home'>
    <popup-header
      page-title='Home'
    >
      <router-link
        class='create-new-story'
        to='/new'
        title='Create New Story'
      >
        <v-icon name='record' />
      </router-link>
    </popup-header>
    <section class='popup-body'>
      <div class='home-body'>
        <!-- <h3 class='list-card-title'>
          Story List
        </h3> -->
        <div class='list-title'>
          <span>Story</span>
          <span>Created</span>
          <span>Operations</span>
        </div>
        <div class='list-container'>
          <div>
            <div
              class='story-item'
              v-for="story in stories"
              v-if="story.id !== recordingStoryId"
            >
              <span>
                {{ story.name }}
              </span>
              <span>
                {{ getApproximateTime(story.time) }}
              </span>
              <span class='operation-list'>
                <router-link
                  class='create-new-story'
                  :to='`/display/${story.id}`'
                  title='Show Story Details'
                >
                  <v-icon name='play' />
                </router-link>
                <a
                  href="javascript: void(0)"
                  v-on:click="deleteStory(story.id)"
                >
                  <v-icon name='trash' />
                </a>
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>
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
    },

    getApproximateTime(time) {
      return getApproximateTime(time);
    },

    deleteStory: async function(id) {
      await api.command(BackgroundProtocol.DELETE_STORY, id);
      this.get();
    }

  },
  components: {
    'popup-header': Head
  },
  data () {
    return {
      stories: [],
      recordingStoryId: undefined
    }
  },
  mounted: async function() {
    this.get();
    this.recordingStoryId = api.getRecordingStoryId();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .create-new-story {
    margin-right: 10px;
  }

  .create-new-story i {
    font-size: 18px;

  }

  .home {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .home-body {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .page-links {
    padding: 3px 5px;
    z-index: 1;
    background: #fff;
  }

  /*.list-card-title {
    z-index: 1;
    background: #fff;
    margin: 0;
    text-align: center;
    font-size: 15px;
    font-weight: 300;
  }*/

  .list-container {
    flex: 1 1 auto;
    overflow: auto;
  }

  .list-title {
    flex: 0 0 auto;
    border-bottom: solid 1px #ccc;
    box-shadow: 0 1px 3px #ccc;
    height: 30px;
  }

  .story-item {
    border-bottom: solid 1px #eee;
  }

  .story-item, .list-title {
    display: flex;
  }

  .story-item span, .list-title span {
    flex: 1 0 1px;
    text-align: center;
  }

  .story-item span {
    padding: 3px 5px;
  }

  .list-title span {
    line-height: 30px;
  }

  .operation-list {
    display: flex;
    justify-content: center;
    align-items: center
  }

  .operation-list a {
    text-decoration: none;
    padding: 0 3px;
    color: #999
  }

  .operation-list a:hover {
    color: #333
  }

  .operation-list i {
    font-size: 14px
  }
</style>
