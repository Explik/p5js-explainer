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
                    @file-code-update="handleCodeUpdate"
                    @file-content-update="handleContentUpdate" 
                    @file-comments-update="handleCommentsUpdate"
                    @file-references-update="handleReferencesUpdate"
                    style="height: 1000px;"/>
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
            codeRanges: [],
            codeComments: [],
            codeReferences: [],
            errorMessage: ""
        }),
        mounted() {
            this.fetchContent();
        },
        methods: {
            async fetchContent() {
                // Fetch explanation from server
                const response = await fetch('http://localhost:3001/explanation/' + this.id);
                const responseData = await response.json();
                this.code = responseData.code;
                this.codeRanges = responseData.codeRanges;
                this.codeComments = responseData.codeComments;
                this.codeReferences = responseData.codeReferences;
            },
            async handleCodeUpdate(newCode) {
                const response = await fetch(`http://localhost:3001/breakdown-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: newCode })
                });

                const responseData = await response.json();

                if (!responseData.error) {
                    this.codeRanges = responseData.codeSnippets.filter(snippet => snippet.type === 'statement');
                    this.errorMessage = undefined;
                }
                else this.errorMessage = responseData.error;
            },
            async handleContentUpdate(newCode) {
                // Update state 
                this.hasChanges = true; 
                this.code = newCode;

                // Save code to server
                await fetch('http://localhost:3001/explanation/' + this.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code })
                });

                // Fetch code ranges from server
                const breakdownResponse = await fetch(`http://localhost:3001/explanation/${this.id}/breakdown-code`, { method: 'POST' });
                const breakdownResponseData = await breakdownResponse.json();
                this.codeRanges = breakdownResponseData.codeSnippets.filter(snippet => snippet.type === 'statement');

                // Save code ranges to server
                const explainResponse = await fetch(`http://localhost:3001/explanation/${this.id}/explain-code`, { method: 'POST' });
                const explainResponseData = await explainResponse.json();
                this.codeComments = explainResponseData.codeComments;
            },
            async handleRangesUpdate() {
                
            },
            async handleCommentsUpdate(newCodeComments) {
                // Save code comments changes to server
                if(newCodeComments.some(s => s.updated)) {
                    this.hasChanges = true; 
                    this.codeComments = newCodeComments.map(s => ({ ...s, updated: false }));
 
                    await fetch('http://localhost:3001/explanation/' + this.id, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ codeComments: this.codeComments })
                    });
                }

                // Generate references 
                const response = await fetch(`http://localhost:3001/explanation/${this.id}/reference-code`, { method: 'POST' });
                const responseData = await response.json();
                this.codeReferences = responseData.codeReferences;
            },
            async handleReferencesUpdate(newCodeReferences) {
                // Save code references changes to server
                if(newCodeReferences.some(s => s.updated)) {
                    this.hasChanges = true; 
                    this.codeReferences = newCodeReferences.map(s => ({ ...s, updated: false }));

                    await fetch('http://localhost:3001/explanation/' + this.id, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ codeReferences: this.codeReferences })
                    });
                }
            }
        }
    }
</script>