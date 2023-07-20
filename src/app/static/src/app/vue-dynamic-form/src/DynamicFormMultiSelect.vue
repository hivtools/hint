<template>
    <div>
        <hint-tree-select :multiple="true"
                     :clearable="false"
                     v-model="value"
                     :options="formControl.options" 
                     :placeholder="selectText"></hint-tree-select>
        <input type="hidden" :value="formControl.value" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import {MultiSelectControl} from "./types";
    import HintTreeSelect from "../../components/HintTreeSelect.vue";
    import { defineComponentVue2GetSetWithProps } from "../../defineComponentVue2/defineComponentVue2";

    interface Props {
        formControl: MultiSelectControl
        selectText?: string
    }

    interface Computed extends Record<string, any>{
        value: {
            get(): string[],
            set: (newVal: string[]) => void
        }
    }

    export default defineComponentVue2GetSetWithProps<unknown, unknown, Computed, Props>({
        name: "DynamicFormMultiSelect",
        props: {
            formControl: {
                type: Object,
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
                    if (Array.isArray(this.formControl.value)) {
                        return this.formControl.value
                    }
                    if (typeof this.formControl.value == "string") {
                        return [this.formControl.value]
                    }
                    return []
                },
                set(newVal: string[]) {
                    this.$emit("update:formControl", {...this.formControl, value: newVal});
                }
            },
        },
        components: {
            HintTreeSelect
        }
    })
</script>
