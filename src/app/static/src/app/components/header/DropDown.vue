<template>
    <div class="dropdown">
        <p class="dropdown-toggle"
        v-translate="text"
        tabindex="0"
        @click="toggle"
        @blur="close">
        </p>
        <div class="dropdown-menu" :class="{'show':show, 'dropdown-menu-right': right}"
        @mouseenter="menuFocused"
        @mouseleave="menuUnfocused">
            <slot></slot>
        </div>
    </div>
</template>
<script lang="ts">
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";

    interface Methods {
        toggle: () => void
        close: () => void
        menuFocused: () => void
        menuUnfocused: () => void
    }

    interface Data {
        show: boolean
        menuFocus: boolean
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
                show: false,
                menuFocus: false
            }
        },
        methods: {
            toggle() {
                this.show = !this.show;
            },
            close: function() {
                if (this.menuFocus) {
                    return
                }
                if (this.delay) {
                    setTimeout(() => {
                        this.show = false;
                    }, 100);
                } else {
                    this.show = false;
                }
            },
            menuFocused() {
                this.menuFocus = true
            },
            menuUnfocused() {
                this.menuFocus = false
                if (this.delay) {
                    setTimeout(() => {
                        this.show = false;
                    }, 100);
                } else {
                    this.show = false;
                }
            },
        }
    })
</script>
<style scoped>
p {
    color: white;
    margin: 0;
    cursor: pointer;
}
</style>
