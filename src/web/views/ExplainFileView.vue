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
          <CodeEditor 
            v-model="content.source" 
            :clickableRanges="clickableRanges"
            :highlightedRanges="highlightedRanges"
            @selection="handleSelection" 
            non-editable />
        </v-col>
        <v-col cols="6" style="margin-top: -48px">
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
                :statement="statement"
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
import CodeEditor from '../components/CodeEditor.vue';
import ExplanationViewer from '../components/ExplanationViewer.vue';
import PreviewViewer from '../components/PreviewViewer.vue';

export default {
  name: "Details",
  components: { CodeEditor, ExplanationViewer, PreviewViewer },
  props: ['id'],
  data: () => ({
    tab: 2,
    position: 0,
    content: {
      source: "// Loading...",
      statements: [],
      functions: [],
      expressions: [],
      references: [],
    },
  }),
  computed: {
    id() {
      return this.$route.params.id;
    },
    statement() {
      const charCount = this.position;
      const statement = this.content?.statements.find(s => s.start <= charCount && charCount <= s.end);
      const code = this.content?.source;

      return (statement && code) ? code.substring(statement.start, statement.end) : undefined;
    },
    descriptions() {
      if (!this.content) {
        return {
          function: 'Loading...',
          statement: 'Loading...',
          expressions: [],
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
        expressions: this.content.expressions.filter(e => e.start <= charCount && charCount <= e.end).map(e => e.description),
        references: this.content.references.filter(r => r.start <= charCount && charCount <= r.end),
      };
    },
    highlightedRanges() {
      if (!this.content)
        return [];
      
      const charCount = this.position;
      const currentStatement = this.content.statements.find(s => s.start <= charCount && charCount <= s.end);
      const endsWithSemicolon = this.content.source[charCount - 1] === ';';

      return currentStatement ? [{
        ...currentStatement, 
        end: endsWithSemicolon ? currentStatement.end - 1 : currentStatement.end
      }] : [];
    },
    clickableRanges() {
      if (!this.content)
        return [];
      
      return this.content.statements
        .map(s => {
          const endsWithSemicolon = this.content.source[s.end - 1] === ';';

          return {
            start: s.start,
            end: endsWithSemicolon ? s.end - 1 : s.end,
          };
        });
    }
  },
  mounted() {
    this.loadContent();
  },
  methods: {
    async loadContent() {
      const response = await fetch(`/${this.id}.json`);
      const responseData = await response.json();

      this.content = {
        source: responseData.code,
        statements: responseData.codeComments?.filter(c => c.type === 'statement') ?? [],
        functions: responseData.codeComments?.filter(c => c.type === 'function') ?? [],
        expressions: responseData.codeComments?.filter(c => c.type === 'expression') ?? [],
        references: responseData.codeReferences?.flatMap(g => g.references.map(r => ({...r, start: g.start, end: g.end}))) ?? [],
      };
      this.position = this.content?.statements[0]?.start ?? 0;
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