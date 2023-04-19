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
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";

    interface Methods {
        toggle: () => void
        close: () => void
    }

    interface Data {
        show: boolean
    }

    interface Props {
        text: string
        right?: boolean
        delay?: boolean
    }

    export default defineComponentVue2WithProps<Data, Methods, unknown, Props>({
        props: {
            text: {
                type: String,
                required: true
            },
            right: {
                type: Boolean,
                required: false
            },
            delay: {
                type: Boolean,
                required: false
            }
        },
        data(): Data {
            return {
                show: false
            }
        },
        methods: {
            toggle() {
                this.show = !this.show;
            },
            close: function() {
                if (this.delay) {
                    setTimeout(() => {
                        this.show = false;
                    }, 1000);
                } else {
                    this.show = false;
                }
            }
        }
    })
</script>
