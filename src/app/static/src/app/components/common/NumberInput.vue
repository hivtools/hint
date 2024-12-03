<template>
    <input :value="value"
           @change="numberUpdate($event)"
           type="number"
           :min="min"
           :max="max"
           :step="step">
</template>

<script setup lang="ts">

defineProps({
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    },
    step: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
})

const emit = defineEmits<{
    (e: "set-value", newValue: number): void
}>();

const numberUpdate = (event: any) => {
    let val = parseFloat(event.target.value);
    const min = parseInt(event.target.min);
    const max = parseInt(event.target.max);
    const step = parseInt(event.target.step);
    if (val % step !== 0) {
        val = Math.round(val / step) * step
    }
    if (val > max) {
        console.log("setting to max ", max)
        val = max
    }
    if (val < min) {
        val = min
    }
    emit("set-value", val)
}

</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Firefox */
input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
}

input {
    text-align: center;
}
</style>
