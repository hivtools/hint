<template>
    <div>
        <div v-if="open" class="modal-backdrop fade show"></div>
        <div class="modal" :class="{show: open}" :style="style">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                    <div v-if="okButton" class="modal-footer">
                        <button type="button" class="btn btn-red" data-dismiss="modal" aria-label="Close" @click="$emit('ok')">
                            OK
                        </button>
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
        props: ["open", "okButton"],
        computed: {
            style: function () {
                return {display: this.open ? "block" : "none"}
            }
        }
    })
</script>