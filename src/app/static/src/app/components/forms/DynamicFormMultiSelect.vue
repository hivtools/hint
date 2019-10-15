<template>
    <div :class="cssClass">
        <tree-select :multiple="true"
                     :clearable="!formControl.required"
                     :options="formControl.options"
                     @input="updateValue"
                     :normalizer="normalizer"
                     :value="initialValue"></tree-select>
        <input type="hidden" v-model="valueAsString" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./types";
    import TreeSelect from '@riophae/vue-treeselect';

    interface Props {
        formControl: SelectControl
    }

    interface TreeSelectNode {
        id: string,
        label: string
    }

    interface Methods {
        normalizer: (node: string) => TreeSelectNode,
        updateValue: (val: string) => void
    }

    export default Vue.extend<{ valueAsString: string, initialValue: string[] }, Methods, {}, Props>({
        name: "DynamicFormMultiSelect",
        props: {
            formControl: Object
        },
        data() {
            return {
                initialValue: this.$props.formControl.default ? [this.$props.formControl.default] : [],
                valueAsString: this.$props.formControl.default || ""
            }
        },
        computed: {
            cssClass() {
                const valid = !this.formControl.required || this.valueAsString.length > 0;
                return valid ? "is-valid" : "is-invalid";
            }
        },
        methods: {
            updateValue(val: string) {
                this.valueAsString = val;
            },
            normalizer(node: string) {
                return {id: node, label: node};
            }
        },
        components: {
            TreeSelect,
            BFormSelect
        }
    })
</script>
