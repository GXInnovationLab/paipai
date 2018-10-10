<template>
  <div :class='{
    "et_display-container": true,
    "normal-size": !editModeEnabled,
    "edit-mode_size": editModeEnabled
  }'>
    <popup-header
      back-route='/'
      back-page-name='Home'
      page-title='Display'
    ></popup-header>

    <article>
      <header>
        <h2>Screen Shots</h2>
        <div>
          <a
            href="javascript: void(0)"
            v-on:click='editImages()'
            v-if='!editModeEnabled'
          >Edit</a>
          <a
            href="javascript: void(0)"
            v-on:click='exportPDF()'
            v-if='!editModeEnabled'
          >Export</a>
          <!-- <a
            href="javascript: void(0)"
            v-on:click='goDemo()'
            v-if='!editModeEnabled'
          >Demo</a> -->
          <a
            href="javascript: void(0)"
            v-on:click='editingZoomIn()'
            v-if='editModeEnabled'
          >Zoom In</a>
          <a
            href="javascript: void(0)"
            v-on:click='editingZoomOut()'
            v-if='editModeEnabled'
          >Zoom Out</a>
          <a
            href="javascript: void(0)"
            v-on:click='saveImagesEditing()'
            v-if='editModeEnabled'
          >Save</a>
          <a
            href="javascript: void(0)"
            v-on:click='cancelEditing()'
            v-if='editModeEnabled'
          >Cancel</a>
          <!-- <a href="javascript: void(0)"></a> -->
        </div>
      </header>
      <section class='et_image-list' v-if='!editModeEnabled'>
        <div
          class='et_image-list-item'
          v-for='(item, index) in order'
          v-bind:item='item'
        >
          <img v-bind:src="images[item].src" :ref='`image-${item}`'/>
          <p>

          </p>
        </div>
      </section>
      <!-- <section id=et_imageList v-if='editModeEnabled'>
        <div
          class='et_image-list-item'
          v-for='(item, index) in order'
        >
          <img v-bind:src="images[item]" />
          <p>

          </p>
        </div>
      </section> -->
      <section id="et_imageList" class='et_image-list'>
        <center class='et_image-list-editor-hint' v-if='editModeEnabled'>Drag the image to change the order</center>
        <div ref='imageListContainer' class='et_imageList-container'>

        </div>
      </section>
    </article>
  </div>
</template>

<script>

import jsPDF from 'jspdf';

import Head from 'Components/common/Head';
import BackgroundProtocol from 'BackgroundProtocol';
import api from 'Popup/backgroundApi';
import Sortable from 'sortablejs';

import { counterFormat, convertSecondsToMS, getTimeMinuteSecond, getCurrentWindowActiveTabId, getApproximateTime } from 'Utils';
import router from '../router';

export default {
  name: 'Display',
  data() {
    return {
      ...this.getInitialData(),
      /**
       * 选择播放模式，
       * REVIEW: 供交互设计人员回顾用户行为
       * DEMO
       * @type {[type]}
       */
      mode: 'DEMO',
      editModeEnabled: false
    };
  },

  methods: {
    getInitialData() {
      return {
        story: {},
        images: {},
        order: [],
        editingOrder: []
      }
    },

    get: async function() {
      const storyId = parseInt(this.$route.params.id);
      const data = await api.command(BackgroundProtocol.GET_STORY_AND_ITS_IMAGES, storyId);
      const { story, images } = data;
      this.story = story;
      this.order = story.order;
      images.forEach( item => {
        this.images[item.id] = {
          src: `filesystem:${window.location.origin}/persistent/${story.name}/${item.name}`,
          pageUrl: item.url
        };
      });
    },

    disableEditingMode: function() {
      this.editModeEnabled = false;
      this.$refs['imageListContainer'].innerHTML = '';
    },

    editingZoomIn: function() {
      // We increase the width of each of these elements by 20 pixels
      const list = document.querySelectorAll('.et_image-list-item');

      const theFirstElement = list[0];
      const resultAfterAdded20px = theFirstElement.offsetWidth + 20;
      const newSize = resultAfterAdded20px > 774 ? 774 : resultAfterAdded20px;

      list.forEach( item => {
        item.style.width = `${newSize}px`;
      });
    },

    editingZoomOut: function() {
      // We reduce the width of each of these elements by 20 pixels
      const list = document.querySelectorAll('.et_image-list-item');

      list.forEach( item => {
        item.style.width = `${item.offsetWidth - 20}px`;
      });
    },

    saveImagesEditing: async function() {
      const updateData = {
        ...this.story,
        order: this.order
      };

      const newData = await api.command(BackgroundProtocol.UPDATE_STORY, updateData);
      this.disableEditingMode();
    },

    cancelEditing: function() {
      this.disableEditingMode();
    },

    editImages: function() {
      this.editModeEnabled = true;
      this.editingOrder = this.order;
      const display = this;
      setTimeout(() => {
        const sortableList = this.$refs['imageListContainer'];;
        let sortableList_innerHTML = '';
        this.editingOrder.forEach( item => {
          sortableList_innerHTML += `
            <div
              class='et_image-list-item drag-handle-selector'
            >
              <img src="${this.images[item].src}" />
              <p>

              </p>
            </div>
          `
        });

        sortableList.innerHTML = sortableList_innerHTML;

        const sortableImageList = new Sortable.create(sortableList, {
          // animation: 300,
          handle: '.drag-handle-selector',
          ghostClass: 'image-list_drag-ghost',
          chosenClass: 'image-list_drag-chosen',
          scrollSensitivity: 50,
          onEnd: function (/**Event*/evt) {
            const { oldIndex, newIndex } = evt;
            display.editingOrder.splice(newIndex, 0, display.editingOrder.splice(oldIndex, 1)[0]);
          },
        });
      }, 100)

      // debugger;
    },

    toDataURL: function(url) {
      return Promise.resolve({
        then: resolve => {
          var xhr = new XMLHttpRequest();
          xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
              resolve(reader.result);
            }
            reader.readAsDataURL(xhr.response);
          };
          xhr.open('GET', url);
          xhr.responseType = 'blob';
          xhr.send();
        }
      })
    },

    exportPDF: async function() {
      const pdf = new jsPDF('l', 'mm', [297, 210]);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgMaxWidth = pageWidth;
      const TITLE_HEIGHT = 6;
      const HYPERLINK_HEIGHT = 15;
      const IMAGE_MARGIN_BOTTOM = 7;
      const imgMaxHeight = pageHeight - TITLE_HEIGHT - HYPERLINK_HEIGHT;
      const limitRatio = imgMaxWidth / imgMaxHeight;
      const addImageToPDF = async (imgId, top) => {
        var r = this.$refs;
        const imgDom = this.$refs[`image-${imgId}`][0];
        const imgRatio = imgDom.clientWidth / imgDom.clientHeight;
        let imgHeight, imgWidth, imgLeft = 0;
        if (limitRatio > imgRatio) {
          imgHeight = imgMaxHeight;
          imgWidth = imgMaxHeight * imgRatio;
          imgLeft = (pageWidth - imgWidth) / 2
        } else {
          imgWidth = imgMaxWidth;
          imgHeight = imgMaxWidth / imgRatio;
        }

        const dataUrl = await this.toDataURL(this.images[imgId].src);

        pdf.setFontSize(10);
        pdf.setTextColor(46, 99, 217);
        pdf.textWithLink(`Page url: ${this.images[imgId].pageUrl}`, 20, top + imgHeight + IMAGE_MARGIN_BOTTOM, { url: this.images[imgId].pageUrl });
        pdf.addImage(dataUrl, 'PNG', imgLeft, top, imgWidth, imgHeight, null, null);
      }

      // pdf.setFont('Avenir');
      // pdf.setFontSize(14);
      // pdf.text( 5, 10, `Story: ${this.story.name}`);

      // Add page and image
      for (let i = 0; i < this.order.length; i ++) {
        i > 0 && pdf.addPage();
        // print pageNumber
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        const pageNumberTop = pageHeight - HYPERLINK_HEIGHT + IMAGE_MARGIN_BOTTOM;
        pdf.text( pageWidth - 20, pageNumberTop, `Page ${i + 1}`);

        await addImageToPDF(this.order[i], TITLE_HEIGHT);
      }
      // pdf.addHTML(10, 10, 'This is a test')
      // pdf.autoPrint();
      pdf.save(`Paipai-${this.story.name}.pdf`);
    },

    goDemo: function() {
      const data = {
        story: this.story,
        images: this.images,
        order: this.order
      };
      api.command(BackgroundProtocol.GO_DEMO, data);
    }

  },

  props: ['id'],

  mounted: async function() {
    this.get();
  },

  destroyed: async function() {
  },

  components: {
    'popup-header': Head
  }
}
</script>

<style scoped>
#et_imageList.et_image-list {
  /*display: flex;
  flex-wrap: wrap;*/
}

.et_event-displaying-cover {
  display: none;
}

.et_display-container {
  display: flex;
  flex-direction: column;
}

.edit-mode_size {
  width: 800px;
  height: 600px;
}

.et_display-container * {
  box-sizing: border-box;
}

.et_display-container article {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.et_display-container header {
  height: 30px;
  min-height: 30px;
  line-height: 30px;
  padding: 0 20px;
  box-shadow: 0px 1px 4px #aaa;
  z-index: 1;
  display: flex;
  justify-content: space-between;
}

.et_display-container header h2 {
  margin: 0;
  font-weight: normal;
}

.et_display-container header a {
  margin-left: 5px
}
</style>
<style>
.et_image-list {
  overflow-y: auto;
}

.et_image-list-editor-hint {
  height: 25px;
  line-height: 25px;
  background: #f2f2f5;
  color: #8a8a8a;
}

.et_imageList-container {
  display: inline-block;
  margin: 0 auto;
}

.et_image-list-item {
  width: 290px;
  margin: 10px auto;
  border-radius: 6px;
  overflow: hidden;
}

.et_image-list-item img {
  width: 100%;
  border: solid 2px #c5c5cc;
  box-sizing: border-box;
}

#et_imageList .et_image-list-item {
  display: inline-block;
  margin: 10px;
  /*width: 380px;*/
  width: 234px;
}

.image-list_drag-ghost {
  opacity: .7
}

.image-list_drag-chosen {
  opacity: .4;
}
</style>
