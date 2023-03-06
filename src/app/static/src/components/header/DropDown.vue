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
        delay: boolean
    }

    export default Vue.extend<Data, Methods, unknown, keyof Props>({
        props: ["text", "right", "delay"],
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
