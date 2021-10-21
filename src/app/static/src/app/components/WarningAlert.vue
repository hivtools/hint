<template>
    <div>
        <h5>Model Options warnings</h5>
        <ul>
            <li v-for="(warning, index) in warnings.modelOptions" :key="index">{{warning.text}}</li>
        </ul>
        <h5>Model Fit warnings</h5>
        <ul>
            <li v-for="(warning, index) in warnings.modelRun" :key="index">{{warning.text}}</li>
        </ul>
        <h5>Model Calibrate warnings</h5>
        <ul>
            <li v-for="(warning, index) in warnings.modelCalibrate" :key="index">{{warning.text}}</li>
        </ul>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {StepWarnings} from "../types";

    interface Props {
        warnings: StepWarnings
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "WarningAlert",
        props: {
            warnings: Object
        }
    });
</script>
