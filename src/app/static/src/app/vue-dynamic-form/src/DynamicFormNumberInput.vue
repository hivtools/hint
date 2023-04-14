<template>
    <input :name="formControl.name"
                  type="number"
                  :number="true"
                  v-model="value"
                  :min="formControl.min"
                  :max="formControl.max"
                  :required="formControl.required"/>
</template>

<script lang="ts">
    import {defineComponent} from "vue";
import { defineComponentVue2GetSetWithProps } from "../../defineComponentVue2/defineComponentVue2";
    // import {BFormInput} from "bootstrap-vue";
    import {NumberControl} from "./types";

    interface Props {
        formControl: NumberControl
    }

    interface Computed extends Record<string, any> {
        value: {
            get(): number | null | undefined,
            set: (newVal: number) => void
        }
    }

    export default defineComponentVue2GetSetWithProps<unknown, unknown, Computed, Props>({
        name: "DynamicFormNumberInput",
        model: {
            prop: "formControl",
            event: "change"
        },
        props: {
            formControl: {
                type: Object,
                required: true
            }
        },
        computed: {
            value: {
                get() {
                    return this.formControl.value;
                },
                set(newVal: number) {
                    this.$emit("change", {...this.formControl, value: newVal});
                }
            },
        },
        components: {
            // BFormInput
        }
    })
</script>
