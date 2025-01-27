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
        val = max
    }
    if (val < min) {
        val = min
    }
    if (!isNaN(val)) {
        emit("set-value", val)

        // Explicitly update the input field if the value differs from what's displayed
        // we do this to prevent the input field being out of sync with the actual value,
        // this can happen due to 2-way data binding, if e.g. we have max value of 3 but user enters 5
        // this will update nicely first time, but if the user then enters 5 again, the underlying value
        // in the parent won't update so the UI doesn't get updated. We need to explicitly update it
        if (event.target.value !== val.toString()) {
            event.target.value = val.toString();
        }
    }
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
