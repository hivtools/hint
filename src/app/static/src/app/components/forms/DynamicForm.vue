<template>
    <b-form :ref="id" class="dynamic-form" :validated="validated" novalidate>
        <dynamic-form-control-section v-for="(section, index) in formMeta.controlSections"
                                      :key="index"
                                      :control-section="section">
        </dynamic-form-control-section>
        <button v-if="includeSubmitButton" class="btn btn-red" v-on:click="submit">{{submitText}}</button>
    </b-form>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BForm} from "bootstrap-vue";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import DynamicFormControlSection from "./DynamicFormControlSection.vue";
    import {DynamicFormMeta} from "./types";
    import {Dict} from "../../types";

    interface Props {
        formMeta: DynamicFormMeta,
        includeSubmitButton: boolean
        submitText: string
        id: string
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
        validate: (formData: FormData) => ValidationResult
        submit: (e: Event) => ValidationResult
    }

    interface Computed {
        required: Dict<boolean>
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
            }
        },
        components: {
            BForm,
            DynamicFormControlGroup,
            DynamicFormControlSection
        },
        computed: {
            required() {
                const requiredDict = {} as Dict<boolean>;
                this.formMeta.controlSections.map(s => {
                    s.controlGroups.map(g => {
                        g.controls.map(c => {
                            requiredDict[c.name] = c.required
                        })
                    })
                });

                return requiredDict;
            }
        },
        methods: {
            validate(formData: FormData) {
                const data: Dict<any> = {};
                let valid = true;
                const missingValues = [] as string[];
                formData.forEach((value, key) => {
                    if (!value && this.required[key]) {
                        valid = false;
                        missingValues.push(key);
                    }
                    data[key] = value || null;
                });

                this.validated = true;
                return {valid, data, missingValues}
            },
            submit(e: Event) {
                if (e) {
                    e.preventDefault();
                }
                const form = this.$refs[this.id] as HTMLFormElement;
                const formData = new FormData(form);
                const result = this.validate(formData);
                if (result.valid) {
                    this.$emit("submit", result.data);
                }
                return result;
            }
        }
    })
</script>
