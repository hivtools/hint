<template>
    <b-form :ref="id" class="dynamic-form" :validated="validated || wasValidated" novalidate>
        <dynamic-form-control-section v-for="(section, index) in formMeta.controlSections"
                                      :key="index"
                                      :control-section="section"
                                      @change="change">
        </dynamic-form-control-section>
        <button v-if="includeSubmitButton" class="btn btn-red" v-on:click="submit">{{submitText}}</button>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import DynamicFormControlSection from "./DynamicFormControlSection.vue";
    import {Control, DynamicFormMeta} from "./types";
    import {Dict} from "../../types";

    interface Props {
        formMeta: DynamicFormMeta,
        includeSubmitButton: boolean
        submitText: string
        id: string
        wasValidated: boolean
    }

    interface ValidationResult {
        data: any
        valid: boolean
        missingValues: string[]
    }

    interface Data {
        validated: boolean
    }

    interface Methods {
        buildValidationResult: () => ValidationResult
        submit: (e: Event) => ValidationResult
        change: () => void
    }

    interface Computed {
        formControlLookup: Dict<Control>
    }

    export default Vue.extend <Data, Methods, Computed, Props>({
        name: "DynamicForm",
        data() {
            return {
                validated: false
            }
        },
        props: {
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
            },
            wasValidated: {
                type: Boolean,
                default: false
            }
        },
        components: {
            BForm,
            DynamicFormControlGroup,
            DynamicFormControlSection
        },
        computed: {
            formControlLookup() {
                const dict = {} as Dict<Control>;
                this.formMeta.controlSections.map(s => {
                    s.controlGroups.map(g => {
                        g.controls.map(c => {
                            dict[c.name] = c
                        })
                    })
                });

                return dict;
            }
        },
        methods: {
            change() {
                Vue.nextTick().then(() => {
                    this.$emit("change", this.buildValidationResult())
                });
            },
            buildValidationResult() {
                const form = this.$refs[this.id] as HTMLFormElement;
                const formData = new FormData(form);
                const data: Dict<any> = {};
                let valid = true;
                const missingValues = [] as string[];
                formData.forEach((value, key) => {
                    value = value as string;
                    const control = this.formControlLookup[key];
                    if (!value && control.required) {
                        valid = false;
                        missingValues.push(key);
                    }
                    if (control.type == "multiselect") {
                        data[key] = value ? value.split(",") : []
                    } else {
                        data[key] = value || null;
                    }
                });

                return {valid, data, missingValues}
            },
            submit(e: Event) {
                if (e) {
                    e.preventDefault();
                }
                const result = this.buildValidationResult();
                this.$emit("submit", result);
                this.validated = true;
                return result;
            }
        }
    })
</script>
