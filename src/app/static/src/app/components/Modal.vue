<template>
    <div>
        <div v-if="open" class="modal-backdrop fade show" @click="$emit('close-modal')"></div>
        <div class="modal" :class="{show: open}" :style="style">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" v-if="hasHeaderSlot">
                        <slot name="header"></slot>
                        <a id="modal-close-button"
                           @click="$emit('close-modal')"
                           style="cursor: pointer">
                            <vue-feather type="x" class="align-middle"/>
                        </a>
                    </div>
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                    <div class="modal-footer" v-if="$slots['footer']">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import { defineComponent } from "vue";
    import VueFeather from "vue-feather";

    export default defineComponent({
        name: "Modal",
        components: {VueFeather},
        props: {
            open: {
                type: Boolean,
                required: true
            }
        },
        emits: ['close-modal'],
        computed: {
            style: function () {
                return {display: this.open ? "block" : "none"}
            },
            hasHeaderSlot: function() {
                return !!this.$slots.header;
            }
        }
    })
</script>
