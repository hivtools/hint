<template>
    <hint-tree-select
            :model-value="value"
            :multiple="false"
            :clearable="false"
            @update:model-value="newVal => value = newVal"
            :options="formOptions">
    </hint-tree-select>
</template>

<script lang="ts">
    import { PropType, defineComponent } from "vue";
    import {SelectControl} from "./types";
    import HintTreeSelect from "../../components/HintTreeSelect.vue";

    export default defineComponent({
        name: "DynamicFormSelect",
        props: {
            formControl: {
                type: Object as PropType<SelectControl>,
                required: true
            },
            selectText: {
                type: String,
                required: false
            }
        },
        computed: {
            value: {
                get() {
                    return this.formControl.value || ""
                },
                set(newVal: string) {
                    this.$emit("update:formControl", {...this.formControl, value: newVal});
                }
            },
            formOptions() {
                if (!this.formControl.excludeNullOption) {
                    const selectOption = {id: "", label: this.selectText}
                    return [selectOption, ...this.formControl.options];
                } else {
                    return this.formControl.options
                }
            }
        },
        components: {
            HintTreeSelect
        },
        mounted() {
            if (this.formControl.excludeNullOption && !this.formControl.value) {
                this.value = this.formControl.options[0].id;
            }
        }
    })
</script>
