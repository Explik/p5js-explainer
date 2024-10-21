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
                <ExplanationEditor :code="code" :codeRanges="codeRanges" @file-content-update="handleContentUpdate" style="height: 1000px;"/>
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
            code: "",
            codeRanges: []
        }),
        mounted() {
            
        },
        methods: {
            fetchContent() {

            },
            async handleContentUpdate(newCode) {
                // Update state 
                this.hasChanges = true; 
                this.code = newCode;

                // Fetch code ranges from server
                const response = await fetch('http://localhost:3001/breakdown', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: this.code })
                });
                const responseData = await response.json();
                this.codeRanges = responseData;
            }
        }
    }
</script>