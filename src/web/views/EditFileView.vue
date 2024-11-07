<template>
    <v-container class="fill-height">
        <v-responsive>
            <v-app-bar color="white">
                <v-app-bar-title>Edit</v-app-bar-title>
                <v-btn :disabled="isLoading" @click="handleRevert"> 
                    <v-icon>mdi-undo-variant</v-icon>
                    Revert
                </v-btn>
                <v-btn :disabled="isLoading" @click="handleSave">
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
                    @update-references="handleReferencesUpdate"/>
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
            updateContent(data) {
                this.code = data.code;
                this.codeSnippets = data.codeSnippets;
                this.codeComments = data.codeComments;
                this.codeReferences = data.codeReferences;

                this.errorMessage = data.error;
            },
            async fetchContent() {
                // Fetch explanation from server
                this.isLoading = true;
                const response = await fetch('http://localhost:3001/explanation/' + this.id);
                const responseData = await response.json();
                this.isLoading = false;

                this.updateContent(responseData);
            },
            async handleCodeUpdate(newCode) {
                if (this.code === newCode) 
                    return;

                this.isLoading = true;
                const response = await fetch(`http://localhost:3001/breakdown-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: newCode })
                });
                const responseData = await response.json();
                this.isLoading = false;

                this.updateContent(responseData);
            },
            async handleCommentsUpdate() {
                // Save code ranges to server
                this.isLoading = true;
                const response = await fetch(`http://localhost:3001/explain-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code, codeSnippets: this.codeSnippets })
                });
                const responseData = await response.json();
                this.isLoading = false;
                
                this.updateContent(responseData);
            },
            async handleReferencesUpdate() {
                // Generate references 
                this.isLoading = true;
                const response = await fetch(`http://localhost:3001/reference-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code, codeSnippets: this.codeSnippets })
                });
                const responseData = await response.json();
                this.isLoading = false;

                this.updateContent(responseData);
            },
            async handleRevert() {
                this.fetchContent();
            },
            async handleSave() {
                const explaination = {
                    code: this.code,
                    codeComments: this.codeComments,
                    codeReferences: this.codeReferences
                };

                // Save code to server
                this.isLoading = true;
                const response = await fetch('http://localhost:3001/explanation/' + this.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(explaination)
                });
                const responseData = await response.json();
                this.isLoading = false;

                this.updateContent(responseData);
            }
        }
    }
</script>