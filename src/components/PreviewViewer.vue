<template>
  <v-card class="px-2 py-2">
    <iframe ref="iframe" :srcdoc="iframeContent" @load="onIframeLoad"></iframe>
  </v-card>
</template>

<script>
export default {
  name: 'PreviewViewer',
  props: {
    code: {
      type: String,
      required: true
    }
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
              method: 'console.log',
              message: args
            }, '*'), 0);

            originalLog.apply(console, args);
          };

          console.error = function(...args) {
            setTimeout(() => window.parent.postMessage({
              type: 'log',
              method: 'console.error',
              message: args
            }, '*'), 0);

            originalError.apply(console, args);
          }
        `
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
        console.log("console.log in Iframe:", ...event.data.message);
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>