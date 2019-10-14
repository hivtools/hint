<template>
    <b-row class="my-2">
        <b-col md="3" v-if="controlGroup.label">
            <label class="group-label">{{controlGroup.label}}</label>
        </b-col>
        <dynamic-form-control v-for="control in controlGroup.controls"
                      :control="control"
                      :col-width="colWidth"></dynamic-form-control>
    </b-row>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BCol, BRow} from "bootstrap-vue";
    import {DynamicControlGroup} from "./fakeFormMeta";
    import DynamicFormControl from "./DynamicFormControl.vue";

    export default Vue.extend<{}, {}, { colWidth: string }, { controlGroup: DynamicControlGroup }>({
        name: "DynamicFormControlGroup",
        props: {
            controlGroup: Object
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
            }
        }
    });

</script>