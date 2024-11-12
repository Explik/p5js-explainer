<template>
  <v-card>
    <iframe id="iframe" ref="iframe" :srcdoc="iframeContent" @load="onIframeLoad"></iframe>
    <div id="console-title">
      <p class="text-subtitle-2">Console</p>
    </div>
    <Console id="console" :data="consoleData.value" variant="light"/>
  </v-card>
</template>

<script>
import { Console, DataAPI } from 'vue-console-feed';
import "vue-console-feed/style.css";

export default {
  name: 'PreviewViewer',
  props: {
    code: {
      type: String,
      required: true
    }
  },
  components: {
    Console
  },
  data() {
    return {
      htmlContent: '<h1>Hello World</h1>',
      cssContent: 'h1 { color: red; }',
      jsContent1: `
          const originalLog = console.log;
          const originalError = console.error;
          
          console.log = function(...args) {
            setTimeout(() => window.parent.postMessage({
              type: 'log',
              method: 'log',
              message: args
            }, '*'), 0);

            originalLog.apply(console, args);
          };

          console.error = function(...args) {
            setTimeout(() => window.parent.postMessage({
              type: 'log',
              method: 'error',
              message: args
            }, '*'), 0);

            originalError.apply(console, args);
          }
        `,
        consoleData: new DataAPI(false, 0)
    };
  },
  computed: {
    iframeContent() {
      // Workaround to create html content, due to vue/compiler-sfc reacting to <script> tags
      const tag = (name, content) => `<${name}>${Array.isArray(content) ? content.join("") : content ?? ""}</${name}>`;
      const tagWithAttributes = (name, attr, content) => `<${name} ${attr}>${Array.isArray(content) ? content.join("") : content ?? ""}</${name}>`;

      return tag('html', [
        tag('head', [
          tagWithAttributes("meta", `charset="UTF-8"`),
          tagWithAttributes('meta', `name="viewport" content="width=device-width, initial-scale=1.0"`),
          tagWithAttributes('script', `src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js"`)
        ]),
        tag('body', [
          tag('main'),
          tag('script', this.jsContent1),
          tag('script', this.code)
        ])
      ].join(''));
    }
  },
  methods: {
    onIframeLoad() {
      window.addEventListener('message', this.handleIframeMessage);
    },
    handleIframeMessage(event) {
      if (event.data?.type === 'log') {
        this.consoleData[event.data.method](...event.data.message);
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  }
};
</script>

<style>
/* Add any component-specific styles here */
#iframe {
  width: 100%;
  height: calc(100% - 200px - 2rem);
  padding: 4px;
  border: none;
}

#console-title {
  width: 100%;
  height: 2rem;
  background-color: rgb(32, 33, 36);
  color: white;
  padding: 4px 8px;
  border-bottom: 1px solid white;
}

#console {
  height: 200px;
  width: 100%;
  background-color: rgb(32, 33, 36);
  overflow-y: auto;
}

#console .console-location {
  display: none;
}
</style>