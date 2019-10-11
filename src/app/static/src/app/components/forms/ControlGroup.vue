<template>
    <b-row class="my-2">
        <b-col md="3">
            <label class="group-label">{{group.label}}</label>
        </b-col>
        <form-control v-for="control in group.controls"
                      :control="control"
                      :col-width="colWidth"></form-control>
    </b-row>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BCol, BRow} from "bootstrap-vue";
    import {ControlGroup} from "./fakeFormMeta";
    import FormControl from "./FormControl.vue";

    export default Vue.extend<{}, {}, { colWidth: string }, { group: ControlGroup }>({
        props: {
            group: Object
        },
        components: {
            BRow,
            BCol,
            FormControl
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