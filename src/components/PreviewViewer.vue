<template>
  <v-card>
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
          window.addEventListener('message', function(event) {
            if (event.data === 'requestData') {
              window.parent.postMessage('responseData', '*');
            }
          });
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
      if (event.data === 'responseData') {
        console.log('Received data from iframe:', event.data);
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