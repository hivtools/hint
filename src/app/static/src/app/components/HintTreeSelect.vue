<template>
    <treeselect
    :key="`${reRender}`"
    :options="options"
    :model-value="modelValue"
    @update:model-value="input"
    @select="select"
    @deselect="deselect">
    <!-- way to pass down all slots -->
    <template v-for="(_, slot) in $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope || {}" />
    </template>
    </treeselect>
</template>
<script lang="ts">
    import { PropType, defineComponent } from "vue";
    import Treeselect from "vue3-treeselect";

    // This wrapper was necessary as this third party treeselect was not
    // updating its value when an external update was being made, e.g.
    // when dataSource changed in Choropleth tab, the filters' values
    // would not update.
    
    // Here we force this treeselect component to re-render if an external
    // change has been made. If an internal change is made (like user
    // selecting a value) then the lastEmittedValue keeps track of it so
    // we can prevent re-render.

    export default defineComponent({
        components: {
            Treeselect
        },
        props: {
            options: {
                type: Array,
                required: true
            },
            modelValue: {
                type: Array as PropType<string | string[] | null | undefined>,
                required: true
            }
        },
        data() {
            return {
                // this is a boolean that toggles to cause key to change
                // and force re-render
                reRender: false,
                lastEmittedValue: "" as string | string[] | null | undefined
            }
        },
        methods: {
            input(value: string[]) {
                this.lastEmittedValue = value;
                this.$emit("update:model-value", value)
            },
            select(value: string[]) {
                this.lastEmittedValue = value;
                this.$emit("update:select", value)
            },
            deselect(value: string[]) {
                this.lastEmittedValue = value;
                this.$emit("update:deselect", value)
            }
        },
        watch: {
            modelValue: {
                handler: function(newVal, oldVal) {
                    // Bit more complicated to check if two string[] have the same elements.
                    // This relates to multi-select filters
                    if (this.lastEmittedValue instanceof Array) {
                        if (this.lastEmittedValue.sort().join(",") !== newVal.sort().join(",")) {
                            this.reRender = !this.reRender
                        }
                    } else if (newVal == null || this.lastEmittedValue != newVal) {
                        this.reRender = !this.reRender
                    }
                },
                deep: true
            }
        }
    })
</script>