<template>
    <div id="equation" ref="equation"/>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import katex from 'katex';

const props = defineProps({
    formula: {
        type: String,
        required: true
    },
});

const equation = ref<HTMLElement | null>(null);

const renderEquation = () => {
    katex.render(props.formula, equation.value!, {
        output: "mathml"
    });
};

onMounted(renderEquation)
watch(() => props.formula, renderEquation);
</script>
