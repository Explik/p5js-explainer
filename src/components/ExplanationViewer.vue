<template>
    <v-card class="px-6 py-6 overflow-y-scroll">
        <div id="position" class="text-body-1 mb-4">Position: {{position}}</div>
        <p id="function" class="text-body-1 mb-4">{{ functionDescription }}</p>
        <p id="statement" class="text-body-1 mb-4">{{ statementDescription }} </p>
        <p id="expression" class="text-body-1 mb-4">{{ expressionDescription }}</p>
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
        statementDescription() {
            return this.descriptions?.statement;
        },
        expressionDescription() {
            return this.descriptions?.expression;
        },
        references() {
            return this.descriptions?.references;
        }
    },
    methods: {
        handlePreviousStatement() {
            console.log('Previous Statement');
        },
        handleNextStatement() {
            console.log('Next Statement');
        },
    }
}

</script>