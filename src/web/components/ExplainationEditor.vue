<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <h1>{{ tabTitle }}</h1>

        <v-tabs v-model="currentTab" color="primary" direction="vertical" class="mb-4">
            <v-tab v-for="tab in tabs" :text="tab.label" :value="tab.name"></v-tab>
        </v-tabs>

        <v-tabs-window v-model="currentTab">
            <v-tabs-window-item value="code" class="p4">
                <v-text-field v-model="fileName" label="Fil navn" required disabled></v-text-field>

                <CodeEditor 
                    v-model="fileContent" 
                    @update:model-value="handleCodeUpdate()"
                    :highlighted-ranges="codeRanges"
                    style="height: 400px;">
                </CodeEditor>

                <span v-if="errorMessage" class="error">ERROR: {{ errorMessage }}</span>
                
                <div class="float-right">
                    <v-btn :disabled="errorMessage" @click="handleTabChange(1)">Gem og videre</v-btn>
                </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="comments">
                <div v-if="codeComments.length"  v-for="(comment, index) in codeComments" :key="index" class="mb-4">
                    <v-card :class="{updated: comment.updated}">
                        <v-card-text>
                            {{ this.code.slice(comment.start, comment.end) }} 
                            <br> 
                            <v-textarea v-model="comment.description" @update:model-value="comment.updated = true" label="Beskrivelse" rows="1"></v-textarea>
                        </v-card-text>
                    </v-card>
                </div>  
                <div v-else>
                    <v-row justify="center" align="center" class="fill-height">
                        <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                    </v-row>
                </div>

                <div class="float-right">
                    <v-btn :disabled="errorMessage" @click="handleTabChange(2)">Gem og videre</v-btn>
                </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="references">
                <div v-if="codeReferences.length" v-for="(referenceGroup, index) in codeReferences" :key="index" class="mb-4">
                    <v-card>
                        <v-card-text>
                            {{ this.code.slice(referenceGroup.start, referenceGroup.end) }} 
                            <br>
                            <v-chip 
                                v-for="reference in referenceGroup.references" 
                                @click:close="handleReferenceDeleted(referenceGroup, reference)"
                                class="mr-2" 
                                outlined
                                closable="">
                                <a target="_blank" :href="reference.link">{{ reference.text }}</a>
                            </v-chip>
                        </v-card-text>
                    </v-card>
                </div>
                <div v-else>
                    <v-row justify="center" align="center" class="fill-height">
                        <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                    </v-row>
                </div>

                <div class="float-right">
                    <v-btn :disabled="errorMessage" @click="handleTabChange(3)">Gem</v-btn>
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
            fileContent: this.code,
            isLoading: true,
            isCodeUpdated: false,
        };
    },
    computed: {
        tabTitle() {
            return this.tabs[this.currentTab]?.title ?? "[tabTitle]";
        },
        isCurrentTabLocked() {
            return this.currentTab === 0 && !this.code.length && !this.codeRanges.length;
        }
    },
    watch: {
        code(newCode) {
            this.fileContent = newCode;
        },
        errorMessage(newErrorMessage) {
            this.errorMessage = newErrorMessage;
        }
    },
    methods: {
        handleCodeUpdate() {
            this.isCodeUpdated = true;
            this.$emit('update-code', this.fileContent);
        },
        handleReferenceDeleted(referenceGroup, reference) {
            referenceGroup.references = referenceGroup.references.filter(r => r !== reference);
            referenceGroup.updated = true;
        },
        handleTabChange(newCurrentTab) {
            if (this.currentTab === newCurrentTab)
                return;
            if (this.isCurrentTabLocked) 
                return;
            
            if (newCurrentTab === 0) {
                // Do nothing
            }
            else if (newCurrentTab === 1) {
                this.$emit('save');
                this.$emit('update-comments');
                this.currentTab = newCurrentTab;
            }
            else if (newCurrentTab === 2) {
                this.$emit('save');
                this.$emit('update-references');
                this.currentTab = newCurrentTab;
            }
            else if (newCurrentTab === 3) {
                this.$emit('save');
                this.$router.push({ name: 'explain', params: { id: this.$route.params.id } });
                return;
            }
            else throw new Error("Invalid tab index");
        }
    }
}
</script>

<style>
    .updated {
        border-left: 4px solid lightblue;
    }
</style>