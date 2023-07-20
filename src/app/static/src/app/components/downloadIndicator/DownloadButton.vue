<template>
    <div id="download-button" class="d-inline-block">
        <button class="btn btn-sm mt-2" :class="disabled ? 'btn-secondary' : 'btn-red'"
                :disabled="disabled">
            <span v-translate="name"></span>
            <vue-feather type="download" size="20" class="icon ml-2"></vue-feather>
        </button>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import VueFeather from "vue-feather";

    interface Props {
        disabled: boolean
        name: string
    }

    export default defineComponentVue2WithProps<unknown, unknown, unknown, Props>({
        name: "downloadButton",
        components: {
            VueFeather
        },
        props: {
            name: {
                type: String,
                required: true
            },
            disabled: {
                type: Boolean,
                required: true
            }
        }
    });
</script>
