<template>
    <b-form :ref="id" :id="id" class="dynamic-form" novalidate>
        <dynamic-form-control-section v-for="(section, index) in formMeta.controlSections"
                                      :key="index"
                                      :control-section="section"
                                      @confirm="confirm"
                                      :required-text="requiredText"
                                      :select-text="selectText"
                                      @updateControlSection="change($event, index)">
        </dynamic-form-control-section>
        <button v-if="includeSubmitButton"
                class="btn"
                :class="disabled? 'btn-secondary' : 'btn-submit'"
                :disabled="disabled"
                v-on:click="submit">{{submitText}}
        </button>
    </b-form>
</template>

<script lang="ts">
    import {BForm} from "bootstrap-vue-next";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import DynamicFormControlSection from "./DynamicFormControlSection.vue";
    import {
        Control,
        DynamicControl,
        DynamicControlSection,
        DynamicFormData,
        DynamicFormMeta
    } from "./types";
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";

    interface Methods {
        buildValue: (control: DynamicControl) => string | string[] | number | null
        submit: (e: Event) => DynamicFormData
        change: (newVal: DynamicControlSection, index: number) => void;
        confirm: (e: Event) => void
    }

    interface Computed {
        controls: Control[]
        disabled: boolean
    }

    interface Props {
        formMeta: DynamicFormMeta,
        includeSubmitButton?: boolean
        submitText?: string
        id?: string
        requiredText?: string
        selectText?: string
    }

    export default defineComponentVue2WithProps<unknown, Methods, Computed, Props>({
        name: "DynamicForm",
        props: {
            id: {
                type: String,
                required: false,
                default: "d-form"
            },
            submitText: {
                type: String,
                required: false,
                default: "Submit"
            },
            includeSubmitButton: {
                type: Boolean,
                required: false,
                default: true
            },
            formMeta: {
                type: Object,
                required: true
            },
            requiredText: {
                type: String,
                required: false,
                default: "required"
            },
            selectText: {
                type: String,
                required: false,
                default: "Select..."
            }
        },
        components: {
            BForm,
            DynamicFormControlGroup,
            DynamicFormControlSection
        },
        beforeMount() {
            this.formMeta.controlSections.map((s: any) => {
                s.controlGroups.map((g: any) => {
                    g.controls.map((c: any) => {
                        c.value = this.buildValue(c)
                    })
                })
            });
        },
        computed: {
            controls() {
                const controls: Control[] = [];
                this.formMeta.controlSections.map((s: any) => {
                    s.controlGroups.map((g: any) => {
                        g.controls.map((c: any) => {
                            controls.push(c);
                        })
                    })
                });
                return controls;
            },
            disabled() {
                return this.controls
                    .filter(c => c.required && (c.value == null || c.value == ""))
                    .length > 0
            }
        },
        methods: {
            change(newVal: DynamicControlSection, index: number) {
                const controlSections = [...this.formMeta.controlSections];
                controlSections[index] = newVal;
                this.$emit("update:formMeta", {...this.formMeta, controlSections})
            },
            buildValue(control: DynamicControl) {
                if (control.type == "multiselect" && !control.value) {
                    return []
                } else return control.value == undefined ? null : control.value;
            },
            submit(e: Event) {
                if (e) {
                    e.preventDefault();
                }
                const result = this.controls
                    .reduce((formData, control) => {
                        formData[control.name] = this.buildValue(control);
                        return formData
                    }, {} as DynamicFormData);
                this.$emit("submit", result);
                return result;
            },
          confirm(e: Event) {
            this.$emit("confirm", e)
          }
        },
        watch: {
            disabled: function(value: boolean) {
                this.$emit("validate", !value);
            }
        },
        mounted() {
            this.$emit("validate", !this.disabled);
        }
    })
</script>
