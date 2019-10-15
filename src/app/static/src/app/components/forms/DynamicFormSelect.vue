<template>
    <select class="form-control" :name="formControl.name" :required="formControl.required">
        <option value>Select...</option>
        <option v-for="opt in formControl.options" :value="opt" :selected="formControl.default === opt">
            {{opt}}
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
        components: {
            BFormSelect
        }
    })
</script>
