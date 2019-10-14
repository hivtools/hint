<template>
    <div>
        <tree-select :multiple="true"
                     :clearable="!formControl.required"
                     :options="options"
                     @input="updateValue"
                     :value="formControl.default"></tree-select>
        <input type="hidden" v-model="value" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./fakeFormMeta";
    import TreeSelect from '@riophae/vue-treeselect';

    interface Props {
        formControl: SelectControl
    }

    export default Vue.extend<{ value: string }, { updateValue: (val: string) => void }, {}, Props>({
        name: "DynamicFormMultiSelect",
        props: {
            formControl: Object
        },
        data() {
            return {
                value: ""
            }
        },
        computed: {
            options() {
                return this.formControl.options!!.map(o => ({id: o, label: o}));
            }
        },
        methods: {
            updateValue(val: string) {
                this.value = val;
            }
        },
        created() {
            this.value = this.formControl.default;
        },
        components: {
            TreeSelect,
            BFormSelect
        }
    })
</script>