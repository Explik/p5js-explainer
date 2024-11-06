<template>
    <v-container class="fill-height">
        <v-responsive>
            <v-row>
                <v-col cols="8" class="mx-auto">
                    <v-card>
                        <v-card-title>
                            <v-icon left class="mr-1">mdi-robot-happy</v-icon>
                            Vælg en fil!
                        </v-card-title>

                        <v-divider></v-divider>

                        <DirectoryTree v-if="!loading" :items="items" @select="handleSelection" style="height: 400px" class="overflow-y-auto"/>
            
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
import DirectoryTree from '../components/DirectoryTree.vue';

export default {
    components: {
        DirectoryTree,
    },
    data: () => ({
        loading: true,
        items: [
            {
                type: "directory",
                id: "default",
                name: "Alle",
                items: [
                    { type: "directory", id: "12", name: "Item #1", 
                        items: [{ type: "file", id: "13", name: "New file" } ]
                    },
                    { type: "file", id: "2", name: "BMI Calculator", icon: "mdi-plus" },
                    { type: "file", id: "3", name: "Item #2",  path: "" },
                    { type: "file", id: "4", name: "Item #3", path: "" },
                    { type: "file", id: "5", name: "Item #4", path: "" },
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
            this.items = responseData;

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