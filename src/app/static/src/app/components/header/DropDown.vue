<template>
    <div class="dropdown">
        <a href="#"
           class="dropdown-toggle"
           v-on:blur="close"
           v-on:click="toggle"
           v-translate="text">
        </a>
        <div class="dropdown-menu" :class="{'show':show, 'dropdown-menu-right': right}">
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
        text: string
        right: boolean
    }

    export default Vue.extend<Data, Methods, {}, keyof Props>({
        props: ["text", "right"],
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