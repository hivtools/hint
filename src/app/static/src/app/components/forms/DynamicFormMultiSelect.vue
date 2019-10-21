<template>
    <div>
        <tree-select :multiple="true"
                     :clearable="false"
                     :value="value"
                     :options="formControl.options"
                     @input="change"></tree-select>
        <input type="hidden" :value="formControl.value" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {SelectControl} from "./types";
    import TreeSelect from '@riophae/vue-treeselect';

    interface Props {
        formControl: SelectControl
    }

    export default Vue.extend<{ value: string[] }, {}, {}, Props>({
        name: "DynamicFormMultiSelect",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object
            }
        },
        data() {
            return {
                value: this.formControl.value ? this.formControl.value as string[] : []
            }
        },
        methods: {
            change(newVal: string[]) {
                this.formControl.value = newVal;
                this.$emit("change", this.formControl)
            }
        },
        components: {
            TreeSelect
        }
    })
</script>
