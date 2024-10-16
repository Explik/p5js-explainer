<template>
  <v-container class="fill-height">
    <v-responsive>
      <v-row>
        <v-col cols="12">
          <h1>Explanation Page</h1>
          <p>Explanation page for item with ID: {{ id }}</p>
          <router-link to="/">Back to Navigation</router-link>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <CodeViewer :code="content?.source ?? '// Loading code...'" @selection="handleSelection" />
        </v-col>
        <v-col cols="6">
          <ExplanationViewer :position="position" :descriptions="descriptions" style="height: 500px;" />
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>

</template>

<script>
import CodeViewer from '@/components/CodeViewer.vue';
import ExplanationViewer from '@/components/ExplanationViewer.vue';

export default {
  name: "Details",
  props: ['id'],
  data: () => ({
    //code: "//Loading code...",
    position: 0,
    content: null,
  }),
  computed: {
    id() {
      return this.$route.params.id;
    },
    descriptions() {
      if (!this.content) {
        return {
          function: 'Loading...',
          statement: 'Loading...',
          expression: 'Loading...',
          references: [],
        };
      }

      const charCount = this.position;

      return {
        function: this.content.functions.find(s => s.start <= charCount && charCount <= s.end)?.description,
        statement: this.content.statements.find(s => s.start <= charCount && charCount <= s.end)?.description,
        expression: this.content.expressions.find(e => e.start <= charCount && charCount <= e.end)?.description,
        references: this.content.references.filter(r => r.start <= charCount && charCount <= r.end),
      };
    },
  },
  mounted() {
    this.loadContent();
  },
  methods: {
    async loadContent() {
      const response = await fetch(`/${this.id}.json`);
      console.log(response);
      const responseData = await response.json();

      this.content = responseData;
    },
    handleSelection(newPosition) {
      this.position = newPosition;
    }
  },
};
</script>