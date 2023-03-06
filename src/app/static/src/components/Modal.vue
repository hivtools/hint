<template>
    <div>
        <div v-if="open" class="modal-backdrop fade show"></div>
        <div class="modal" :class="{show: open}" :style="style">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
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
    import Vue from "vue"

    export default Vue.extend({
        name: "Modal",
        props: ["open"],
        computed: {
            style: function () {
                return {display: this.open ? "block" : "none"}
            }
        }
    })
</script>