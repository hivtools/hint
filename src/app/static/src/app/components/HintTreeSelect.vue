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