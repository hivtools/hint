<template>
    <b-row class="my-2">
        <b-col md="3" v-if="controlGroup.label">
            <label class="group-label">{{controlGroup.label}}
                <span v-if="required">*</span>
            </label>
        </b-col>
        <dynamic-form-control v-for="(control, index) in controlGroup.controls"
                              :key="control.name"
                              v-model="controlGroup.controls[index]"
                              :col-width="colWidth"></dynamic-form-control>
    </b-row>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BCol, BRow} from "bootstrap-vue";
    import {DynamicControlGroup} from "./types";
    import DynamicFormControl from "./DynamicFormControl.vue";

    export default Vue.extend<{}, {}, { colWidth: string, required: boolean },
        { controlGroup: DynamicControlGroup }>({
        name: "DynamicFormControlGroup",
        props: {
            controlGroup: Object
        },
        model: {
            prop: "controlGroup",
            event: "change"
        },
        components: {
            BRow,
            BCol,
            DynamicFormControl
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
            }
        }
    });

</script>
