<template>
    <div>
        <v-list-group v-if="item.type === 'directory'" :value="item.id">
            <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-folder" :title="item.name"></v-list-item>
            </template>

            <TreeItem
                v-for="subItem in item.items"
                :key="subItem.id"
                :item="subItem"
                @select="(c) => $emit('select', c)"
            />
        </v-list-group>

        <v-list-item
            v-else
            prepend-icon="mdi-file"
            :title="item.name"
            @click="$emit('select', item)"
        ></v-list-item>
    </div>
</template>

<script>
export default {
    name: "TreeItem",
    emits: ["select"],
    props: {
        item: {
            type: Object,
            required: true,
        },
    }
};
</script>
