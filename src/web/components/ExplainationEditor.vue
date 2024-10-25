<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <v-tabs 
            v-model="tab"
            color="primary"
            direction="vertical">
            <v-tab text="#1 - Indhold" value="code"></v-tab>
            <v-tab text="#2 Forklaringer" value="comments"></v-tab>
            <v-tab text="#3 - Referencer" value="references"></v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
            <v-tabs-window-item value="code" class="p4">
                <h1>Indhold</h1>
                <v-text-field v-model="fileName" label="Fil navn" required></v-text-field>

                <CodeEditor v-model="fileContent" @update:model-value="handleCodeUpdate()"></CodeEditor>
                
                <CodeViewer v-if="codeRanges.length" :code="fileContent" :highlighted-ranges="codeRanges"></CodeViewer>
                <v-row v-else justify="center" align="center" class="fill-height">
                    <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                </v-row>
                
                <div class="float-right">
                    <v-btn @click="handleRangesUpdate()">Gem og videre</v-btn>
                </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="comments">
                <h1>Forklaringer</h1>

                <div v-for="(comment, index) in codeComments" :key="index" class="mb-4">
                    <v-card :class="{updated: comment.updated}">
                        <v-card-text>
                            {{ this.code.slice(comment.start, comment.end) }} 
                            <br> 
                            <v-textarea v-model="comment.description" @update:model-value="comment.updated = true" label="Beskrivelse" rows="1"></v-textarea>
                        </v-card-text>
                    </v-card>
                </div>  

                <div class="float-right">
                    <v-btn @click="handleCommentsUpdate()">Gem og videre</v-btn>
                </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="references">
                <h1>Referencer</h1>

                <div v-for="(referenceGroup, index) in codeReferences" :key="index" class="mb-4">
                    <v-card>
                        <v-card-text>
                            {{ this.code.slice(referenceGroup.start, referenceGroup.end) }} 
                            <br>
                            <v-chip 
                                v-for="reference in referenceGroup.references" 
                                @click:close="handleReferenceDeleted(referenceGroup, reference)"
                                class="mr-2" 
                                outlined
                                closable="">{{ reference.text }}</v-chip>
                        </v-card-text>
                    </v-card>
                </div>

                <div class="float-right">
                    <v-btn @click="handleReferencesUpdate()">Gem og videre</v-btn>
                </div>
            </v-tabs-window-item>
        </v-tabs-window>
    </v-card>
</template>

<script>
import CodeEditor from './CodeEditor.vue';
import CodeViewer from './CodeViewer.vue';

export default {
    name: "ExplanationEditor",
    components: { CodeEditor, CodeViewer },
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
        }
    },
    data() {
        //debugger;
        return {
            step: 1,
            tab: undefined,
            fileName: "",
            fileContent: this.code,
            isLoading: true,
        };
    },
    computed: {
        subtotal() {
            return this.products.reduce((acc, product) => acc + product.quantity * product.price, 0)
        },
        total() {
            return this.subtotal + Number(this.shipping ?? 0)
        },
    },
    methods: {
        handleCodeUpdate() {
            this.$emit('file-content-update', this.fileContent);
        },
        handleRangesUpdate() {
            this.$emit('file-ranges-update', this.codeRanges);
            this.tab = "comments";
        },
        handleCommentsUpdate() {
            this.$emit('file-comments-update', this.codeComments);
            this.tab = "references";  
        },
        handleReferencesUpdate() {
            this.$emit('file-references-update', this.codeReferences);
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