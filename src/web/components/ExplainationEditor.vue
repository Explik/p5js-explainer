<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <v-text-field v-model="fileName" label="Fil navn" required></v-text-field>

        <v-spacer></v-spacer>

        <v-stepper v-model="step" @update:model-value="handleStepChange" :items="stepTitles" show-actions>
            <template v-slot:item.1>
                <h3 class="text-h6">{{ stepTitles[0] }}</h3>
                <br>
                <CodeEditor v-model="fileContent"></CodeEditor>
            </template>

            <template v-slot:item.2>
                <h3 class="text-h6">{{ stepTitles[1] }}</h3>
                <br>
                <CodeViewer v-if="codeRanges.length" :code="fileContent" :highlighted-ranges="codeRanges"></CodeViewer>
                <v-row v-else justify="center" align="center" class="fill-height">
                    <v-progress-circular indeterminate color="grey" style="height: 100px;"></v-progress-circular>
                </v-row>
            </template>

            <template v-slot:item.3>
                <h3 class="text-h6">{{ stepTitles[2] }}</h3>
                <br>
                <div v-for="(comment, index) in codeComments" :key="index" class="mb-4">
                    <v-card :class="{updated: comment.updated}">
                        <v-card-text>
                            {{ this.code.slice(comment.start, comment.end) }} 
                            <br> 
                            <v-textarea v-model="comment.description" @update:model-value="comment.updated = true" label="Beskrivelse" rows="1"></v-textarea>
                        </v-card-text>
                    </v-card>
                </div>  
            </template>

            <template v-slot:item.4>
                <h3 class="text-h6">{{ stepTitles[3] }}</h3>
                <br>
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
            </template>

            <template v-slot:item.5>
                <h3 class="text-h6">{{ stepTitles[4] }}</h3>
                <br>
            </template>
        </v-stepper>
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
        stepTitles: ['Kode', 'Opdeling', 'Forklaringer', 'Referencer', 'Gem'],
        
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
        handleStepChange(newStep) {
            switch(newStep) {
                case 2: 
                    this.$emit('file-content-update', this.fileContent);
                    break;
                case 3:
                    this.$emit('file-ranges-update', this.codeRanges);
                    break;
                case 4:
                    this.$emit('file-comments-update', this.codeComments);
                    break;
                case 5: 
                    this.$emit('file-references-update', this.codeReferences);
                    break;file-references-update
            }
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