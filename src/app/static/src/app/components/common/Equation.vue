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

const emit = defineEmits<{
    (e: "enter-plot-type", plotType: string): void
    (e: "leave-plot-type", plotType: string): void
}>();

const equation = ref<HTMLElement | null>(null);

const renderEquation = () => {
    katex.render(props.formula, equation.value!, {
        trust: true,
        strict: false
    });

    equation.value!.querySelectorAll(".hoverable").forEach((element) => {
        element.addEventListener("mouseenter", () => {
            if (element.firstElementChild) {
                emit("enter-plot-type", element.firstElementChild.id);
            }
        });
        element.addEventListener("mouseleave", () => {
            if (element.firstElementChild) {
                emit("leave-plot-type", element.firstElementChild.id);
            }
        });
    });
};

onMounted(renderEquation)
watch(() => props.formula, renderEquation);
</script>
