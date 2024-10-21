<template>
    <div id="editor" ref="editor"></div>
</template>

<script>
export default {
    props: ['input'],
    data: () => ({
        editor: null
    }),
    mounted() {
        // Setting up javascript editor
        this.editor = ace.edit(this.$refs.editor);
        this.editor.setTheme("ace/theme/xcode");
        this.editor.session.setMode("ace/mode/javascript");
        this.editor.setShowPrintMargin(false);

        this.editor.setValue(this.input ?? "");
        this.editor.on("change", this.handleInput);
    },
    watch: {
        input() {
            if (!this.editor) {
                console.error('Editor is not initialized');
                return;
            }
                
            this.editor.setValue(this.input);
        }
    },
    methods: {
        handleInput() {
            if (!this.editor) {
                console.error('Editor is not initialized');
                return;
            }

            this.$emit('update:modelValue', this.editor.getValue());
        }
    }
}
</script>


<style lang="css">
    #editor {
        height: 100%;
        min-height: 200px;
        width: 100%;
        border-radius: 4px;
    }
</style>