<template>
    <b-form-select class="form-control"
            v-model="value"
            :name="formControl.name"
            :required="formControl.required">
        <option v-if="!formControl.excludeNullOption" value>{{selectText}}</option>
        <option v-for="opt in formControl.options"
                :key="opt.id"
                :value="opt.id">
            {{opt.label}}
        </option>
    </b-form-select>
</template>

<script lang="ts">
    import { PropType, defineComponent } from "vue";
    import {BFormSelect} from "bootstrap-vue-next";
    import {SelectControl} from "./types";

    export default defineComponent({
        name: "DynamicFormSelect",
        props: {
            formControl: {
                type: Object as PropType<SelectControl>,
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
                    this.$emit("update:formControl", {...this.formControl, value: newVal});
                }
            }
        },
        components: {
            BFormSelect
        },
        mounted() {
            if (this.formControl.excludeNullOption && !this.formControl.value) {
                this.value = this.formControl.options[0].id;
            }
        }
    })
</script>
