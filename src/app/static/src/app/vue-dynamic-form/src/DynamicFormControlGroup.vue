<template>
    <b-row class="my-2">
        <label v-if="controlGroup.label" class="col-form-label col-md-5">{{controlGroup.label}}
            <span v-if="helpText" class="icon-small" v-tooltip="helpText">
                    <vue-feather type="help-circle" style="vertical-align: middle;"></vue-feather>
                </span>
            <span v-if="required"
                  class="ml-1"
                  :class="{'text-danger': anyValueEmpty(controlGroup)}"
                  style="font-size: small;">({{requiredText}})</span>
        </label>
        <dynamic-form-control v-for="(control, index) in controlGroup.controls"
                              :key="control.name"
                              :formControl="control"
                              @update:formControl="change($event, index)"
                              @mousedown="confirm"
                              @click="confirm"
                              :required-text="requiredText"
                              :select-text="selectText"
                              :col-width="colWidth"></dynamic-form-control>
    </b-row>
</template>
<script lang="ts">
    import {PropType, defineComponent} from "vue";
    import {BRow} from "bootstrap-vue-next";
    import {Control, DynamicControlGroup} from "./types";
    import DynamicFormControl from "./DynamicFormControl.vue";
    import VueFeather from "vue-feather";
    import FormsMixin from "./FormsMixin";

    export default defineComponent({
        extends: FormsMixin,
        name: "DynamicFormControlGroup",
        props: {
            controlGroup: {
                type: Object as PropType<DynamicControlGroup>,
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
        components: {
            BRow,
            DynamicFormControl,
            VueFeather
        },
        methods: {
            anyValueEmpty(controlGroup: DynamicControlGroup){
                return !!controlGroup.controls.find(c => this.valueIsEmpty(c.value))
            },
            change(newVal: Control, index: number) {
                const controls = [...this.controlGroup.controls];
                controls[index] = newVal;
                this.$emit("updateControlGroup", {...this.controlGroup, controls})
            },
            confirm(e: Event) {
                this.$emit("confirm", e)
            }
        },
        computed: {
            colWidth() {
                const numCols = this.controlGroup.controls.length;
                if (numCols == 1) {
                    return "6"
                } else {
                    return "3"
                }
            },
            required() {
                return this.controlGroup.controls.length == 1
                    && this.controlGroup.controls[0].required
            },
            helpText() {
                return this.controlGroup.controls.length == 1 ?
                    this.controlGroup.controls[0].helpText : ""
            }
        }
    });

</script>
