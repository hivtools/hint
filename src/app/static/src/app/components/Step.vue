<template>
    <div class="col step" :class="[{'active': active, 'complete': complete, 'enabled': enabled}]">
        <button class="btn" :class="[{'btn-red': complete, 'btn-white': enabled && !complete}]"
                :disabled="!enabled"
                v-on:click="$emit('jump', number)">{{ number }}
        </button>
        <div class="text-center mt-3" v-translate="textKey"></div>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from '../defineComponentVue2/defineComponentVue2';

    interface Props {
        active: boolean,
        number: number,
        textKey: string,
        enabled: boolean,
        complete: boolean
    }

    export default defineComponentVue2WithProps<unknown, unknown, unknown, Props>({
        props: {
            active: {
                type: Boolean,
                required: true
            },
            number: {
                type: Number,
                required: true
            },
            textKey: {
                type: String,
                required: true
            },
            enabled: {
                type: Boolean,
                required: true
            },
            complete: {
                type: Boolean,
                required: true
            }
        }
    })

</script>
