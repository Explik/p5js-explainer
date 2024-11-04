<template>
    <v-list v-model:opened="open">
        <DirectoryTreeItem v-for="item in items" :key="item.id" :item="item" @select="(c) => $emit('select', c)" />
    </v-list>
</template>

<script>    
    import DirectoryTreeItem from "./DirectoryTreeItem.vue";

    export default {
        name: "DirectoryTree",
        props: {
            items: {
                type: Array,
                required: true,
            },
        },
        components: {
            DirectoryTreeItem,
        },
        emits: ["select"],
        data: () => ({
            open: [],
        }),
    };
</script>