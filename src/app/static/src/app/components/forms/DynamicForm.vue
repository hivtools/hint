<template>
    <b-form :ref="id" :id="id" class="dynamic-form" novalidate>
        <dynamic-form-control-section v-for="(section, index) in formMeta.controlSections"
                                      :key="index"
                                      v-model="formMeta.controlSections[index]">
        </dynamic-form-control-section>
        <button v-if="includeSubmitButton"
                class="btn btn-red"
                :disabled="disabled"
                v-on:click="submit">{{submitText}}
        </button>
        <p>* Required field</p>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import DynamicFormControlSection from "./DynamicFormControlSection.vue";
    import {Control, DynamicControl, DynamicFormData, DynamicFormMeta} from "./types";

    interface Props {
        formMeta: DynamicFormMeta,
        includeSubmitButton: boolean
        submitText: string
        id: string
    }

    interface Methods {
        buildValue: (control: DynamicControl) => string | string[] | number | null
        submit: (e: Event) => DynamicFormData
    }

    interface Computed {
        controls: Control[]
        disabled: boolean
    }

    const props = {
        id: {
            type: String,
            default: "d-form"
        },
        submitText: {
            type: String,
            default: "Submit"
        },
        includeSubmitButton: {
            type: Boolean,
            default: true
        },
        formMeta: {
            type: Object
        }
    };

    export default Vue.extend <{}, Methods, Computed, Props>({
        name: "DynamicForm",
        props: props,
        model: {
            prop: "formMeta",
            event: "change"
        },
        components: {
            BForm,
            DynamicFormControlGroup,
            DynamicFormControlSection
        },
        computed: {
            controls() {
                const controls: Control[] = [];
                this.formMeta.controlSections.map(s => {
                    s.controlGroups.map(g => {
                        g.controls.map(c => {
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
            buildValue(control: DynamicControl) {
              if (control.type == "multiselect" && !control.value){
                  return []
              }
              else return control.value == undefined ? null : control.value;
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
            }
        }
    })
</script>
