<template>
    <div ref="editor"></div>
</template>

<script>
    export default {
        props: {
            code: {
                type: String,
                required: true
            }
        },
        data: () => ({
            editor: null
        }),
        mounted() {
            this.editor = ace.edit(this.$refs.editor);
            this.editor.setTheme("ace/theme/monokai");
            this.editor.setShowPrintMargin(false);
            this.editor.setReadOnly(true);
            this.editor.session.setMode("ace/mode/javascript");

            this.editor.setValue(this.code);
            this.editor.on("mousedown", this.handleSelection);
        },
        watch: {
            code() {
                this.editor.setValue(this.code);
            }
        },
        methods: {
            handleSelection(e) {
                if (!this.editor){
                    console.log('Editor is not initialized');
                    return
                }

                // Calculates current cursor position in editor
                const position = this.editor.renderer.screenToTextCoordinates(e.clientX, e.clientY);
                const row = position.row;
                const column = position.column;
                const lines = this.editor.session.getLines(0, row);

                let charCount = 0;
                for (let i = 0; i < lines.length - 1; i++)
                    charCount += lines[i].length + 1; // +1 for the newline character
                charCount += column;

                // Emits selection event with position
                this.$emit('selection', charCount);
            }
        }
    }
</script>

<style lang="css" scoped>
    div {
        height: 100%; 
        width: 100%;
        border-radius: 4px;
    }
</style>