<template>
    <b-form-input :name="formControl.name"
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
    import {BFormInput} from "bootstrap-vue-next";
    import {NumberControl} from "./types";

    interface Props {
        formControl: NumberControl
    }

    interface Computed extends Record<string, any> {
        value: {
            get(): number | undefined,
            set: (newVal: number) => void
        }
    }

    export default defineComponentVue2GetSetWithProps<unknown, unknown, Computed, Props>({
        name: "DynamicFormNumberInput",
        props: {
            formControl: {
                type: Object,
                required: true
            }
        },
        computed: {
            value: {
                get() {
                    if (!this.formControl.value) {
                        return undefined
                    }
                    return this.formControl.value;
                },
                set(newVal: number) {
                    this.$emit("update:formControl", {...this.formControl, value: newVal});
                }
            },
        },
        components: {
            BFormInput
        }
    })
</script>
