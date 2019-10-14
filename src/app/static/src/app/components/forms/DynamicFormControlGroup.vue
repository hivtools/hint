<template>
    <b-row class="my-2">
        <b-col md="3">
            <label class="group-label">{{group.label}}</label>
        </b-col>
        <dynamic-form-control v-for="control in group.controls"
                      :control="control"
                      :col-width="colWidth"></dynamic-form-control>
    </b-row>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BCol, BRow} from "bootstrap-vue";
    import {ControlGroup} from "./fakeFormMeta";
    import DynamicFormControl from "./DynamicFormControl.vue";

    export default Vue.extend<{}, {}, { colWidth: string }, { group: ControlGroup }>({
        name: "DynamicFormControlGroup",
        props: {
            group: Object
        },
        components: {
            BRow,
            BCol,
            DynamicFormControl
        },
        computed: {
            colWidth() {
                const numCols = this.group.controls.length;
                if (numCols == 1) {
                    return "6"
                } else {
                    return "3"
                }
            }
        }
    });

</script>