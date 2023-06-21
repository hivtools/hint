<template>
    <treeselect
    :key="`${reRender}`"
    :options="options"
    :model-value="modelValue"
    @update:model-value="input">
        <slot></slot>
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
                preventReRender: false
            }
        },
        methods: {
            input(value: string[]) {
                this.preventReRender = true
                this.$emit("update:model-value", value)
            }
        },
        watch: {
            options: {
                handler: function(newVal, oldVal) {
                    this.preventReRender = false
                },
                deep: true
            },
            modelValue: {
                handler: function(newVal, oldVal) {
                    if (!this.preventReRender) {
                        this.reRender = !this.reRender
                    }
                },
                deep: true
            }
        }
    })
</script>