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
          <v-tabs v-model="tab" align-tabs="left">
            <v-tab :value="1">Kør</v-tab>
            <v-tab :value="2">Forklar</v-tab>
          </v-tabs>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item :value="1">
              <PreviewViewer 
                :code="content?.source"
                style="height: 600px;"
              />
            </v-tabs-window-item>
            <v-tabs-window-item :value="2">
              <ExplanationViewer 
                :position="position" 
                :descriptions="descriptions" 
                @previous-statement-selected="handlePreviousStatementSelected"
                @next-statement-selected="handleNextStatementSelected"
                style="height: 600px;" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>

</template>

<script>
import CodeViewer from '@/components/CodeViewer.vue';
import ExplanationViewer from '@/components/ExplanationViewer.vue';
import PreviewViewer from '@/components/PreviewViewer.vue';

export default {
  name: "Details",
  props: ['id'],
  data: () => ({
    //code: "//Loading code...",
    tab: null,
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
      const statementIndex = this.content.statements.findIndex(s => s.start <= charCount && charCount <= s.end);

      return {
        function: this.content.functions.find(s => s.start <= charCount && charCount <= s.end)?.description,
        previousStatement: this.content.statements[statementIndex - 1]?.description,
        statement: this.content.statements[statementIndex]?.description,
        nextStatement: this.content.statements[statementIndex + 1]?.description,
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
    },
    handlePreviousStatementSelected() {
      const charCount = this.position;
      const statementIndex = this.content.statements.findIndex(s => s.start <= charCount && charCount <= s.end);
      
      if (statementIndex > 0)
        this.position = this.content.statements[statementIndex - 1]?.start ?? 0;
    },
    handleNextStatementSelected() {
      const charCount = this.position;
      const statementIndex = this.content.statements.findIndex(s => s.start <= charCount && charCount <= s.end);
      
      if (statementIndex < this.content.statements.length - 1)
        this.position = this.content.statements[statementIndex + 1]?.start ?? 0;
    },
    
  },
};
</script>