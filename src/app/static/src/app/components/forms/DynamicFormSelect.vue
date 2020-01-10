<template>
    <select class="form-control"
            v-model="value"
            :name="formControl.name"
            :required="formControl.required">
        <option value>{{selectText}}</option>
        <option v-for="opt in formControl.options"
                :key="opt.id"
                :value="opt.id">
            {{opt.label}}
        </option>
    </select>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BFormSelect} from "bootstrap-vue";
    import {SelectControl, SharedDynamicFormProps} from "./types";

    interface Props extends SharedDynamicFormProps {
        formControl: SelectControl,
        selectText: string
    }

    interface Computed {
        value: string
    }

    export default Vue.extend<{}, {}, Computed, Props>({
        name: "DynamicFormSelect",
        props: {
            selectText: String,
            requiredText: String,
            formControl: Object
        },
        model: {
            prop: "formControl",
            event: "change"
        },
        computed: {
            value: {
                get() {
                    return this.formControl.value || ""
                },
                set(newVal: string) {
                    this.$emit("change", {...this.formControl, value: newVal});
                }
            },
        },
        components: {
            BFormSelect
        }
    })
</script>
