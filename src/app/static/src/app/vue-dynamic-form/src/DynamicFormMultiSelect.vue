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
    import { PropType, defineComponent } from "vue";

    export default defineComponent({
        name: "DynamicFormMultiSelect",
        props: {
            formControl: {
                type: Object as PropType<MultiSelectControl>,
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
