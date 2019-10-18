<template>
    <div>
        <h3>{{controlSection.label}}</h3>
        <p v-if="controlSection.description" class="text-muted">{{controlSection.description}}</p>
        <dynamic-form-control-group v-for="(group, index) in controlSection.controlGroups"
                                    :key="index"
                                    :control-group="group"
                                    @change="change"></dynamic-form-control-group>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";

    export default Vue.extend({
        name: "DynamicFormControlSection",
        props: ["controlSection"],
        methods: {
            change(input: { name: string, value: string | string[] }) {
                this.$emit("change", input);
            }
        },
        components: {
            DynamicFormControlGroup
        }
    })
</script>
