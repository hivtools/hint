<template>
    <select @change="change" class="form-control"
            v-model="formControl.value"
            :name="formControl.name"
            :required="formControl.required">
        <option value>Select...</option>
        <option v-for="opt in formControl.options"
                :key="opt.id"
                :value="opt.id"
                :selected="(formControl.value || '') === opt.id">
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
            formControl: {
                type: Object
            }
        },
        model: {
            prop: "formControl",
            event: "change"
        },
        methods: {
            change() {
                this.$emit("change", this.formControl)
            }
        },
        components: {
            BFormSelect
        }
    })
</script>
