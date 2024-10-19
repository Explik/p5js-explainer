<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <h2 class="mb-2">Forklaring af "{{formattedStatement}}"</h2>
        <div id="statements" class="mb-8">
            <div class="mb-2">
                <v-card>
                    <v-card-text>
                        <div class="limited-text">
                            {{ previousStatementDescription ?? "[Program start]" }}
                        </div>
                    </v-card-text>
                </v-card>

                <v-card id="current-statement-card" class="mt-4 mb-4 d-flex align-center justify-center">
                    <v-card-text class="bg-slate-200 mt-auto mb-auto">
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
            </div>

            <div>
                <v-btn icon :disabled="!previousStatementDescription" @click="handlePreviousStatement" class="mr-2">
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>

                <v-btn icon :disabled="!nextStatementDescription" @click="handleNextStatement">
                    <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
            </div>
        </div>

        <div v-if="functionDescription" class="mb-8">
            <h3 class="underline">Kontekst</h3>
            <v-card>
                <v-card-text>
                    {{ functionDescription }}
                </v-card-text>
            </v-card>
        </div>

        <div id="expressions" v-if="expressionsDescription?.length" class="mb-8">
            <h3 class="underline">Trin for trin</h3>
            <v-card v-for="description in expressionsDescription" class="mb-4">
                <v-card-text>
                    {{ description }}
                </v-card-text>

            </v-card>
        </div>

        <div id="reference" v-if="references?.length">
            <h3 class="underline">Referencer</h3>
            <span v-for="(reference, i) in references">
                <a :href="reference.link">
                    {{ reference.text }}
                </a>
                <span v-if="i < references.length - 2">, </span>
                <span v-if="i == references.length - 2"> & </span>
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
        statement: {
            type: String, 
            required: false
        },
        descriptions: {
            type: Object,
            required: true
        }
    },
    computed: {
        formattedStatement() {
            if (!this.statement)
                return "????"

            const maxLength = 25; 
            return (this.statement.length > maxLength - 3) ? this.statement.substring(0, maxLength - 3) + "..." : this.statement;
        },
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

#current-statement-card {
    min-height: 120px;
}
</style>