<template>
    <v-container class="fill-height">
        <v-responsive>
            <v-app-bar color="white">
                <v-app-bar-title>Edit</v-app-bar-title>
                <v-btn> 
                    <v-icon>mdi-undo-variant</v-icon>
                    Revert
                </v-btn>
                <v-btn>
                    <v-icon>mdi-content-save-all</v-icon>
                    Save
                </v-btn>
            </v-app-bar>
            <v-main>
                <ExplanationEditor 
                    :code="code" 
                    :codeRanges="codeRanges" 
                    :codeComments="codeComments"
                    :codeReferences="codeReferences"
                    :error-message="errorMessage"
                    @update-code="handleCodeUpdate" 
                    @update-comments="handleCommentsUpdate"
                    @update-references="handleReferencesUpdate"
                    @save="handleSave"/>
            </v-main>
        </v-responsive>
    </v-container>
</template>

<script>
import ExplanationEditor from '../components/ExplainationEditor.vue';

    export default {
        name: "Edit",
        props: ['id'],
        components: { ExplanationEditor },
        data: () => ({
            hasChanges: false,
            isLoading: false,
            code: "",
            codeSnippets: [],
            codeComments: [],
            codeReferences: [],
            errorMessage: ""
        }),
        computed: {
            codeRanges() {
                return this.codeSnippets?.filter(snippet => snippet.type === 'statement') ?? [];
            }
        },
        mounted() {
            this.fetchContent();
        },
        methods: {
            async fetchContent() {
                // Fetch explanation from server
                const response = await fetch('http://localhost:3001/explanation/' + this.id);
                const responseData = await response.json();
                this.code = responseData.code;
                this.codeSnippets = responseData.codeSnippets;
                this.codeComments = responseData.codeComments;
                this.codeReferences = responseData.codeReferences;
            },
            async handleCodeUpdate(newCode) {
                if (this.code === newCode) 
                    return;

                const response = await fetch(`http://localhost:3001/breakdown-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: newCode })
                });

                const responseData = await response.json();

                if (!responseData.error) {
                    this.codeSnippets = responseData.codeSnippets;
                    this.codeComments = []; // Invalidates existing comments 
                    this.codeReferences = []; // Invalidates existing references
                    this.errorMessage = undefined;
                }
                else this.errorMessage = responseData.error;
            },
            async handleCommentsUpdate() {
                // Save code ranges to server
                const explainResponse = await fetch(`http://localhost:3001/explain-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code, codeSnippets: this.codeSnippets })
                });
                const explainResponseData = await explainResponse.json();

                if (!explainResponseData.error) {
                    this.codeComments = explainResponseData.codeComments;
                }
                else this.errorMessage = explainResponseData.error;
            },
            async handleReferencesUpdate() {
                // Generate references 
                const response = await fetch(`http://localhost:3001/reference-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code, codeSnippets: this.codeSnippets })
                });
                const responseData = await response.json();

                if (!responseData.error) {
                    this.codeReferences = responseData.codeReferences;
                }
                else this.errorMessage = responseData.error;
            },
            async handleSave() {
                const explaination = {
                    code: this.code,
                    codeComments: this.codeComments,
                    codeReferences: this.codeReferences
                };

                // Save code to server
                await fetch('http://localhost:3001/explanation/' + this.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(explaination)
                });

            }
        }
    }
</script>