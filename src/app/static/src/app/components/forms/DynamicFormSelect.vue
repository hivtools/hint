<template>
    <select @change="change" class="form-control" :name="formControl.name" :required="formControl.required">
        <option value>Select...</option>
        <option v-for="opt in formControl.options"
                :key="opt.id"
                :value="opt.id"
                :selected="formControl.default === opt.id">
            {{opt.label}}
        </option>
    </select>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./types";

    interface Props {
        formControl: SelectControl
    }

    export default Vue.extend<{}, {}, {}, Props>({
        name: "DynamicFormSelect",
        props: {
            formControl: Object
        },
        methods: {
            change(value: string) {
                this.$emit("change", value);
            }
        },
        components: {
            BFormSelect
        }
    })
</script>
