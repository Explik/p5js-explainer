<template>
    <div id="editor" :class="{nonEditable: nonEditable}" ref="editor"></div>
</template>

<script>
export default {
    props: {
        modelValue: {
            type: String,
            required: false,
            default: ""
        },
        clickableRanges: {
            type: Array,
            default: () => []
        },
        highlightedRanges: {
            type: Array,
            default: () => []
        },
        nonEditable: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        editor: null,
        editorMarkers: []
    }),
    mounted() {
        // Setting up javascript editor
        this.editor = ace.edit(this.$refs.editor);
        this.editor.setTheme("ace/theme/xcode");
        this.editor.session.setMode("ace/mode/javascript");
        this.editor.setShowPrintMargin(false);

        // Removing (default) interactive elements if non-editable
        if (this.nonEditable) {
            this.editor.setReadOnly(true);
            this.editor.setHighlightActiveLine(false);
            this.editor.setHighlightGutterLine(false);
            this.editor.renderer.$cursorLayer.element.style.display = "none"
        }
        
        // Populate editor with input and set up event listeners
        this.editor.setValue(this.modelValue);
        this.editor.clearSelection();
        this.editor.on("mousedown", this.handleSelection);
        this.editor.on("change", this.handleInput);
    },
    watch: {
        modelValue() {
            if (!this.editor) {
                console.error('Editor is not initialized');
                return;
            }

            if (this.editor.getValue() !== this.modelValue) {
                this.editor.setValue(this.modelValue);
                this.editor.clearSelection();
            }
        },
        clickableRanges() {
            this.updateRanges();
        },
        highlightedRanges() {
            this.updateRanges();
        }
    },
    methods: {
        handleInput() {
            if (!this.editor) {
                console.error('Editor is not initialized');
                return;
            }

            this.$emit('update:modelValue', this.editor.getValue());
        },
        handleSelection(e) {
            if (!this.editor) {
                console.log('Editor is not initialized');
                return
            }

            // Calculates current cursor position in editor
            const coordinates = this.editor.renderer.screenToTextCoordinates(e.clientX, e.clientY);
            const position = this.convertCoordinatesToPosition(coordinates.row, coordinates.column);

            // Emits selection event with position
            if (this.clickableRanges.some(r => r.start <= position && position <= r.end))
                this.$emit('selection', position);
        },
        convertCoordinatesToPosition(row, column) {
            const content = this.editor.getValue();
            let currentRow = 0;
            let currentColumn = 0;
            let position = 0;

            for (let i = 0; i < content.length; i++) {
                if (currentRow === row && currentColumn === column) {
                    return position;
                }
                if (content[i] === '\n') {
                    currentRow++;
                    currentColumn = 0;
                } else {
                    currentColumn++;
                }
                position++;
            }

            // If coordinates are at the end of the content
            return position;
        },
        convertPositionToCoordinates(position) {
            const content = this.editor.getValue();
            let row = 0;
            let column = 0;
            let charCount = 0;

            for (let i = 0; i < content.length; i++) {
                if (charCount === position) {
                    return { row, column };
                }
                if (content[i] === '\n') {
                    row++;
                    column = 0;
                } else {
                    column++;
                }
                charCount++;
            }

            // If position is at the end of the content
            return { row, column };
        },
        updateRanges() {
            // Remove existing markers
            this.editorMarkers.forEach(marker => this.editor.session.removeMarker(marker));

            // Add new markers
            const highlightedRanges = this.highlightedRanges.map(r => ({...r, type: "primary"}));
            const clickableRanges = this.clickableRanges.map(r => ({...r, type: "secondary"}));
            
            const ranges = [...highlightedRanges, ...clickableRanges].map(highlight => {
                const startCoordinates = this.convertPositionToCoordinates(highlight.start);
                const endCoordinates = this.convertPositionToCoordinates(highlight.end);

                const isPrimary = highlight.type === 'primary';
                const className = isPrimary ? 'highlight-primary' : 'highlight-secondary';

                return [className, new ace.Range(startCoordinates.row, startCoordinates.column, endCoordinates.row, endCoordinates.column)];
            });

            this.editorMarkers = ranges.map(range => this.editor.session.addMarker(range[1], range[0], "text"));
        }
    }
}
</script>

<style lang="css">
#editor {
    height: 100%;
    min-height: 400px;
    width: 100%;
    border-radius: 4px;
}

#editor.nonEditable .ace_marker-layer .ace_bracket { display: none }

.highlight-primary {
    position: absolute;
    background-color: rgba(124, 192, 255, 0.5);
    cursor: pointer;
}

.highlight-secondary {
    position: absolute;
    background-color: rgba(124, 192, 255, 0.1);
    cursor: pointer;
}
</style>