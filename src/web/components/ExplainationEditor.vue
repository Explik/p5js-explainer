<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <h1>{{ currentTabTitle }}</h1>

        <v-tabs v-model="currentTab" color="primary" direction="vertical" class="mb-4">
            <v-tab>
                {{ tabs[0].label }}
            </v-tab>
            <v-tab>
                {{ tabs[1].label }}
                <v-icon v-if="hasCodeCommentsChanged" color="red" class="ml-1">mdi-alert-rhombus</v-icon>
            </v-tab>
            <v-tab>
                {{ tabs[2].label }}
                <v-icon v-if="hasCodeReferencesChanged" color="red" class="ml-1">mdi-alert-rhombus</v-icon>
            </v-tab>
        </v-tabs>

        <v-tabs-window v-model="currentTab">
            <v-tabs-window-item value="code" class="p4" style="min-height: 100px">
                <v-text-field v-model="fileName" label="Fil navn" required disabled></v-text-field>

                <CodeEditor v-model="currentCode" @update:model-value="handleCodeUpdate()"
                    :highlighted-ranges="codeRanges" style="height: 400px;">
                </CodeEditor>

                <span v-if="errorMessage" class="error">ERROR: {{ errorMessage }}</span>
            </v-tabs-window-item>

            <v-tabs-window-item value="comments" class="p4" style="min-height: 100px">
                <div v-if="isGeneratingComments" class="mb-4">
                    <v-row justify="center" align="center" class="fill-height">
                        <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                    </v-row>
                </div>
                <div v-else-if="!codeComments.length" class="mb-4">
                    <v-btn @click="handleCodeCommentUpdate" class="mt-4">Generer kode kommentarer</v-btn>
                </div>
                <div v-else-if="hasCodeChanged" class="mb-4">
                    <v-alert type="warning" outlined>
                        Kommentarerne er potentielt forældede. Regenerer dem for at sikre at de passer til den nye kode.
                    </v-alert>

                    <v-btn @click="handleCodeCommentUpdate" class="mt-4">Regenerer kode kommentarer</v-btn>
                </div>

                <div v-if="codeComments.length" v-for="(comment, index) in codeComments" :key="index" class="mb-4">
                    <v-card :class="{ updated: comment.updated }">
                        <v-card-text>
                            {{ this.code.slice(comment.start, comment.end) }}
                            <br>
                            <v-textarea v-model="comment.description" @update:model-value="comment.updated = true"
                                label="Beskrivelse" rows="1"></v-textarea>
                        </v-card-text>
                    </v-card>
                </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="references" class="p4" style="min-height: 100px">
                <div v-if="isGeneratingReferences" class="mb-4">
                    <v-row justify="center" align="center" class="fill-height">
                        <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                    </v-row>
                </div>
                <div v-else-if="!codeReferences.length" class="mb-4">
                    <v-btn @click="handleCodeReferenceUpdate" class="mt-4">Generer kode referencer</v-btn>
                </div>
                <div v-else-if="hasCodeChanged" class="mb-4">
                    <v-alert type="warning" outlined>
                        Referencerne er potentielt forældede. Regenerer dem for at sikre at de passer til den nye kode.
                    </v-alert>      
                    <v-btn @click="handleCodeReferenceUpdate" class="mt-4">Regenerer kode referencer</v-btn>              
                </div>
                
                <div v-if="codeReferences.length" v-for="(referenceGroup, index) in codeReferences" :key="index"
                    class="mb-4">
                    <v-card>
                        <v-card-text>
                            {{ this.code.slice(referenceGroup.start, referenceGroup.end) }}
                            <br>
                            <v-chip v-for="reference in referenceGroup.references"
                                @click:close="handleReferenceDeleted(referenceGroup, reference)" class="mr-2" outlined
                                closable="">
                                <a target="_blank" :href="reference.link">{{ reference.text }}</a>
                            </v-chip>
                        </v-card-text>
                    </v-card>
                </div>
            </v-tabs-window-item>
        </v-tabs-window>
    </v-card>
</template>

<script>
import { errorMessages } from 'vue/compiler-sfc';
import CodeEditor from './CodeEditor.vue';

export default {
    name: "ExplanationEditor",
    components: { CodeEditor },
    props: {
        prompts: {
            type: Array,
            required: false,
            default: () => []
        },
        references: {
            type: Array,
            required: false,
            default: () => []
        },
        isLoading: {
            type: Boolean,
            required: false,
            default: false
        },
        code: {
            type: String,
            required: false,
            default: ""
        },
        codeRanges: {
            type: Array,
            required: false,
            default: () => []
        },
        codeComments: {
            type: Array,
            required: false,
            default: () => []
        },
        codeReferences: {
            type: Array,
            required: false,
            default: () => []
        },
        errorMessage: {
            type: String,
            required: false,
            default: undefined
        }
    },
    data() {
        //debugger;
        return {
            step: 1,
            currentTab: 0,
            tabs: [
                { id: "code", label: "Trin 1 - Indhold", title: "Indhold" },
                { id: "comments", label: "Trin 2A - Forklaringer", title: "Forklaringer" },
                { id: "references", label: "Trin 2B - Referencer", title: "Referencer" }
            ],
            fileName: this.$route.params.id + ".js",
            currentCode: this.code,
            codeForComments: this.code,
            codeForReferences: this.code,
            isGeneratingComments: false,
            isGeneratingReferences: false
        };
    },
    computed: {
        currentTabTitle() {
            return this.tabs[this.currentTab]?.title ?? "[tabTitle]";
        },
        hasCodeChanged() {
            return this.currentCode !== this.code;
        },
        hasCodeCommentsChanged() {
            return this.codeComments?.length && this.codeForComments !== this.currentCode;
        },
        hasCodeReferencesChanged() {
            return this.codeReferences?.length && this.codeForReferences !== this.currentCode;
        }
    },
    watch: {
        code(newCode) {
            this.currentCode = newCode;
        },
        codeComments(newComments) {
            this.codeForComments = this.code;
            this.isGeneratingComments = false;
        },
        codeReferences(newReferences) {
            this.codeForReferences = this.code;
            this.isGeneratingReferences = false;
        }
    },
    methods: {
        handleCodeUpdate() {
            this.$emit('update-code', this.currentCode);
        },
        handleCodeCommentUpdate() {
            this.isGeneratingComments = true;
            this.$emit('update-comments');
        },
        handleCodeReferenceUpdate() {
            this.isGeneratingReferences = true;
            this.$emit('update-references');
        },
        handleReferenceDeleted(referenceGroup, reference) {
            referenceGroup.references = referenceGroup.references.filter(r => r !== reference);
            referenceGroup.updated = true;
        }
    }
}
</script>

<style>
.updated {
    border-left: 4px solid lightblue;
}
</style>