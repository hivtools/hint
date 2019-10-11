<template>
    <div>
        <tree-select :multiple="true"
                     :options="options"
                     @input="updateValue"></tree-select>
        <input type="hidden" v-model="value" :name="formControl.name"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {FormControl} from "./fakeFormMeta";
    import TreeSelect from '@riophae/vue-treeselect';

    interface Props {
        formControl: FormControl
    }

    export default Vue.extend<{value: string}, {updateValue: (val: string) => void}, {}, Props>({
        name: "FormMultiSelect",
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
                console.log(this.formControl.options);
                return this.formControl.options!!.map(o => ({id: o, label: o}));
            }
        },
        methods: {
            updateValue(val: string) {
                this.value = val;
            }
        },
        components: {
            TreeSelect,
            BFormSelect
        }
    })
</script>