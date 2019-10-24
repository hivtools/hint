<template>
    <div>
        <h3>{{controlSection.label}}</h3>
        <p v-if="controlSection.description" class="text-muted">{{controlSection.description}}</p>
        <dynamic-form-control-group v-for="(group, index) in controlSection.controlGroups"
                                    :key="index"
                                    :control-group="group"
                                    @change="change($event, index)"></dynamic-form-control-group>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import DynamicFormControlGroup from "./DynamicFormControlGroup.vue";
    import {DynamicControlGroup, DynamicControlSection} from "./types";

    interface Methods {
        change: (newVal: DynamicControlGroup, index: number) => void
    }

    interface Props {
        controlSection: DynamicControlSection
    }

    export default Vue.extend<{}, Methods, {}, Props>({
        name: "DynamicFormControlSection",
        props: {
            controlSection: {
                type: Object
            }
        },
        model: {
            prop: "controlSection",
            event: "change"
        },
        methods: {
            change(newVal: DynamicControlGroup, index: number) {
                const controlGroups = [...this.controlSection.controlGroups];
                controlGroups[index] = newVal;
                this.$emit("change", {...this.controlSection, controlGroups})
            }
        },
        components: {
            DynamicFormControlGroup
        }
    })
</script>
