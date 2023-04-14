<template>
    <select class="form-control"
            v-model="value"
            :name="formControl.name"
            :required="formControl.required">
        <option v-if="!formControl.excludeNullOption" value>{{selectText}}</option>
        <option v-for="opt in formControl.options"
                :key="opt.id"
                :value="opt.id">
            {{opt.label}}
        </option>
    </select>
</template>

<script lang="ts">
import { defineComponentVue2GetSetWithProps } from "../../defineComponentVue2/defineComponentVue2";
    // import {BFormSelect} from "bootstrap-vue";
    import {SelectControl} from "./types";

    interface Props {
        formControl: SelectControl
        selectText?: string
    }

    interface Computed extends Record<string, any> {
        value: {
            get(): string,
            set: (newVal: string) => void
        }
    }

    export default defineComponentVue2GetSetWithProps<unknown, unknown, Computed, Props>({
        name: "DynamicFormSelect",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object,
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
                    return this.formControl.value || ""
                },
                set(newVal: string) {
                    this.$emit("change", {...this.formControl, value: newVal});
                }
            }
        },
        components: {
            // BFormSelect
        },
        mounted() {
            if (this.formControl.excludeNullOption && !this.formControl.value) {
                this.value = this.formControl.options[0].id;
            }
        }
    })
</script>
