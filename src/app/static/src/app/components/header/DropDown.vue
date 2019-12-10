<template>
    <div class="dropdown">
        <a href="#"
           class="dropdown-toggle"
           v-on:blur="close"
           v-on:click="toggle">
            {{text}}
        </a>
        <div class="dropdown-menu" :class="show && 'show'">
            <slot></slot>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";

    interface Methods {
        toggle: () => void
        close: () => void
    }

    interface Data {
        show: boolean
    }

    interface Props {
        style: string,
        text: string
    }

    export default Vue.extend<Data, Methods, {}, "text">({
        props: ["text"],
        data(): Data {
            return {
                show: false
            }
        },
        methods: {
            toggle() {
                this.show = !this.show;
            },
            close() {
                this.show = false;
            }
        }
    })
</script>