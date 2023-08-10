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
    import {PropType, defineComponent} from "vue";
    import {BFormInput} from "bootstrap-vue-next";
    import {NumberControl} from "./types";

    export default defineComponent({
        name: "DynamicFormNumberInput",
        props: {
            formControl: {
                type: Object as PropType<NumberControl>,
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
