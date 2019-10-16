<template>
    <div :class="cssClass">
        <tree-select :multiple="true"
                     :clearable="false"
                     v-model="value"
                     :options="formControl.options"></tree-select>
        <input type="hidden" :value="value" :name="formControl.name"/>
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
        props: {
            formControl: Object
        },
        data() {
            return {
                value: this.formControl.default ? [this.formControl.default] : []
            }
        },
        computed: {
            cssClass() {
                const valid = !this.formControl.required || this.value.length > 0;
                return valid ? "is-valid" : "is-invalid";
            }
        },
        components: {
            TreeSelect
        }
    })
</script>
