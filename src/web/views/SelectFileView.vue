<template>
    <v-container class="fill-height">
        <v-responsive>
            <v-row>
                <v-col cols="8" class="mx-auto">
                    <v-card style="height: 400px;">
                        <v-card-title>
                            <v-icon left class="mr-1">mdi-robot-happy</v-icon>
                            Vælg en fil!
                        </v-card-title>

                        <v-divider></v-divider>

                        <v-list v-if="!loading" v-model:opened="open">
                            <v-list-group v-for="category in categories" :value="category.id">
                                <template v-slot:activator="{ props }">
                                    <v-list-item v-bind="props" prepend-icon="mdi-folder"
                                        :title="category.name"></v-list-item>
                                </template>

                                <v-list-item v-for="item in category.items" :key="item.name" prepend-icon="mdi-file"
                                    :title="item.name" :value="title" @click-once="() => handleSelection(item)">
                                </v-list-item>
                            </v-list-group>
                        </v-list>
                        <v-row v-else justify="center" align="center" class="fill-height">
                            <v-progress-circular indeterminate color="grey"></v-progress-circular>
                        </v-row>
                    </v-card>
                </v-col>
            </v-row>
        </v-responsive>

    </v-container>
</template>

<script>
export default {
    data: () => ({
        loading: true,
        open: [],
        categories: [
            {
                id: "default",
                name: "Alle",
                items: [
                    { name: "BMI Calculator", icon: "mdi-plus", path: "bmi-calculator" },
                    { name: "Item #2", icon: "mdi-eye", path: "" },
                    { name: "Item #3", icon: "mdi-pencil", path: "" },
                    { name: "Item #4", icon: "mdi-delete", path: "" },
                ]
            },
        ],
    }),
    mounted() {
        this.loadContent();
    },
    methods: {
        async loadContent() {
            this.loading = true;

            const response = await fetch(`/index.json`);
            const responseData = await response.json();

            const category = this.categories.find(c => c.id === "default");
            category.items = responseData.map(itemName => ({ name: itemName, path: itemName.split(".")[0], icon: 'mdi-file' }));

            this.loading = false;
        },
        handleSelection(item) {
            this.$router.push({
                name: "explain",
                params: { id: item.path },
            });
        }
    }
}
</script>