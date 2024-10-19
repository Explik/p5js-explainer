<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <v-row>
            <v-col cols="2" class="d-flex flex-column align-center justify-center">
                <v-btn icon class="w-full mb-4" @click="handlePreviousStatement">
                    <v-icon>mdi-arrow-up</v-icon>
                </v-btn>

                <!--<v-btn icon class="w-full mt-4 mb-4">
                    <v-icon>mdi-circle</v-icon>
                </v-btn>-->

                <v-btn icon class="w-full" @click="handleNextStatement">
                    <v-icon>mdi-arrow-down</v-icon>
                </v-btn>
            </v-col>

            <v-col cols="10" class="d-flex flex-column  justify-center">
                <v-card outlined>
                    <v-card-text>
                        <div class="limited-text">
                            {{ previousStatementDescription ?? "[Program start]"}}
                        </div>
                    </v-card-text>
                </v-card>
                <v-card class="mt-4 mb-4">
                    <v-card-text class="bg-slate-200">
                        {{ statementDescription }}
                    </v-card-text>
                </v-card>
                <v-card>
                    <v-card-text class="bg-slate-200">
                        <div class="limited-text">
                            {{ nextStatementDescription ?? "[Program slut]" }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <h3 v-if="functionDescription" class="underline">Kontekst</h3>
        <p id="function" class="text-body-1 mb-4">{{ functionDescription }}</p>

        <div id="expressions" v-if="expressionsDescription?.length">
            <h3 class="underline" >Trin for trin</h3>
            <v-card v-for="description in expressionsDescription" class="mb-4">
                <v-card-text>
                    {{ description }}
                </v-card-text>
                
            </v-card>
        </div>

        <div id="reference" v-if="references?.length">
            <span>Læs mere: </span>
            <span v-for="(reference, i) in references">
                <a :href="reference.link">
                    {{ reference.text }}
                </a>
                <span v-if="i < references.length - 1">, </span>
            </span>
        </div>
    </v-card>
</template>

<script>
export default {
    props: {
        position: {
            type: Number,
            required: false
        },
        descriptions: {
            type: Object,
            required: true
        }
    },
    computed: {
        functionDescription() {
            return this.descriptions?.function;
        },
        previousStatementDescription() {
            return this.descriptions?.previousStatement;
        },
        statementDescription() {
            return this.descriptions?.statement;
        },
        nextStatementDescription() {
            return this.descriptions?.nextStatement;
        },
        expressionsDescription() {
            return this.descriptions?.expressions;
        },
        references() {
            return this.descriptions?.references;
        }
    },
    methods: {
        handlePreviousStatement() {
            this.$emit('previous-statement-selected');
        },
        handleNextStatement() {
            this.$emit('next-statement-selected');
        },
    }
}

</script>

<style scoped>
    .limited-text {
        color: rgb(148 163 184);
        white-space: nowrap; 
        word-break: normal; 
        overflow: hidden; 
        text-overflow: ellipsis;
        width: 97%;
    }
</style>