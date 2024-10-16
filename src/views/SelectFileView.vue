<template>
    <v-container>
        <v-card>
            <v-card-title>
                <v-icon left class="mr-1">mdi-robot-happy</v-icon>
                Vælg en fil!
            </v-card-title>

            <v-divider></v-divider>

            <v-list v-model:opened="open">
                <v-list-group 
                    v-for="category in categories"
                    :value="category.id">
                    <template v-slot:activator="{ props }">
                        <v-list-item v-bind="props" prepend-icon="mdi-folder" :title="category.name"></v-list-item>
                    </template>

                    <v-list-item 
                        v-for="item in category.items" 
                        :key="item.name" 
                        prepend-icon="mdi-file" 
                        :title="item.name"
                        :value="title"
                        @click-once="() => handleSelection(item)">
                    </v-list-item>
                </v-list-group>
            </v-list>
        </v-card>
    </v-container>
</template>

<script>
export default {
    data: () => ({
        open: [],
        categories: [
            { 
                id: "category-1", 
                name: "Category 1", 
                icon: "mdi-weight-bathroom", 
                items: [
                    { name: "BMI Calculator", icon: "mdi-plus", path: "bmi-calculator" },
                    { name: "Item #2", icon: "mdi-eye", path: "" },
                    { name: "Item #3", icon: "mdi-pencil", path: "" },
                    { name: "Item #4", icon: "mdi-delete", path: "" },
                ] 
            },
        ],
    }),
    methods: {
        handleSelection(item) {
            this.$router.push({
                name: "explain",
                params: { id: item.path },
            });
        }
    }
}
</script>