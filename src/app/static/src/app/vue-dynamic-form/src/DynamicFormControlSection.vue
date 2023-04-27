<template>
    <div>
        <h3 @click="toggleSection" :class="{'cursor-pointer': controlSection.collapsible}">
            {{controlSection.label}}
            <component v-if="controlSection.collapsible"
                       style="vertical-align: initial"
                       :is="chevronComponent"></component>
        </h3>
        <b-collapse v-model="open">
            <p v-if="controlSection.description" class="text-muted">{{controlSection.description}}</p>
            <dynamic-form-control-group v-for="(group, index) in controlSection.controlGroups"
                                        :key="index"
                                        :control-group="group"
                                        @confirm="confirm"
                                        :required-text="requiredText"
                                        :select-text="selectText"
                                        @updateControlGroup="change($event, index)"></dynamic-form-control-group>
            <b-row v-if="controlSection.documentation" class="documentation mb-4">
                <b-col>
                    <a href="#" @click="toggleDocumentation">
                        <vue-feather type="info"></vue-feather>
                        How to use these settings
                        <component style="vertical-align: top"
                                   :is="documentationChevronComponent"></component>
                    </a>
                    <b-collapse v-model="showDocumentation">
                        <div class="my-1" v-html="controlSection.documentation"></div>
                    </b-collapse>
                </b-col>
            </b-row>
        </b-collapse>
        
        <!-- <h3 @click="toggleSection" :class="{'cursor-pointer': controlSection.collapsible}">
            {{controlSection.label}}
            <component v-if="controlSection.collapsible"
                       style="vertical-align: initial"
                       :is="chevronComponent"></component>
        </h3>
        <div>
            <p v-if="controlSection.description" class="text-muted">{{controlSection.description}}</p>
            <dynamic-form-control-group v-for="(group, index) in controlSection.controlGroups"
                                        :key="index"
                                        :control-group="group"
                                        @confirm="confirm"
                                        :required-text="requiredText"
                                        :select-text="selectText"
                                        @updateControlGroup="change($event, index)"></dynamic-form-control-group>
            <div v-if="controlSection.documentation" class="documentation mb-4">
                <div>
                    <a href="#" @click="toggleDocumentation">
                        <info-icon></info-icon>
                        How to use these settings
                        <component style="vertical-align: top"
                                   :is="documentationChevronComponent"></component>
                    </a>
                    <div>
                        <div class="my-1" v-html="controlSection.documentation"></div>
                    </div>
                </div>
            </div>
        </div> -->
    </div>
</template>

<script lang="ts">

    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import {DynamicControlGroup, DynamicControlSection} from "./types";
    import VueFeather from "vue-feather";
    import {BCollapse, BRow, BCol} from "bootstrap-vue-next";

    interface Methods {
        change: (newVal: DynamicControlGroup, index: number) => void
        toggleDocumentation: (e: Event) => void
        toggleSection: () => void
        confirm: (e: Event) => void
    }

    interface Props {
        controlSection: DynamicControlSection
        requiredText?: string
        selectText?: string
    }

    interface Data {
        open: boolean
        showDocumentation: boolean
    }

    export default defineComponentVue2WithProps<Data, Methods, unknown, Props>({
        name: "DynamicFormControlSection",
        data() {
            return {
                showDocumentation: false,
                open: true
            }
        },
        props: {
            controlSection: {
                type: Object,
                required: true
            },
            requiredText: {
                type: String,
                required: false
            },
            selectText: {
                type: String,
                required: false
            }
        },
        computed: {
            chevronComponent() {
                if (this.open) {
                    return "chevron-up-icon"
                }
                return "chevron-down-icon"
            },
            documentationChevronComponent() {
                if (this.showDocumentation) {
                    return "chevron-up-icon"
                }
                return "chevron-down-icon"
            }
        },
        methods: {
            change(newVal: DynamicControlGroup, index: number) {
                const controlGroups = [...this.controlSection.controlGroups];
                controlGroups[index] = newVal;
                this.$emit("updateControlSection", {...this.controlSection, controlGroups})
            },
            toggleDocumentation(e: Event) {
                e.preventDefault();
                this.showDocumentation = !this.showDocumentation
            },
            toggleSection() {
                if (this.controlSection.collapsible) {
                    this.open = !this.open;
                }
            },
            confirm(e: Event) {
                this.$emit("confirm", e)
            }
        },
        components: {
            DynamicFormControlGroup,
            VueFeather,
            BCollapse,
            BRow,
            BCol
        },
        mounted() {
            if (this.controlSection.collapsible && this.controlSection.collapsed) {
                this.open = false
            }
        }
    })
</script>
