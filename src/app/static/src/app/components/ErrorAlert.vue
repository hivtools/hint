<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{message}}</div>
        <div v-if="hasTrace" >
            <a href="#" @click="toggleTrace"><strong>{{traceLinkText}}</strong></a>
            <div v-if="showTrace" class="ml-3">
                <div v-for="traceMessage in error.trace" class="error-trace">{{traceMessage}}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Error} from "../generated.d";

    interface Data {
        showTrace: Boolean
    }

    interface Props {
        error: Error | null
    }

    interface Computed {
        message: String,
        hasTrace: Boolean,
        traceLinkText: String
    }

    interface Methods {
        toggleTrace: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            "error": Object
        },
        data(): Data {
            return {
                showTrace: false
            }
        },
        computed: {
            message: function() {
                return this.error ?
                    (this.error.detail ? this.error.detail : this.error.error) :
                    "";
            },
            hasTrace: function() {
                return !!this.error && !!this.error.trace && this.error.trace.length > 0
            },
            traceLinkText: function() {
                return (this.showTrace ? "hide" : "show") + " details";
            }
        },
        methods: {
            toggleTrace: function() {
                this.showTrace = !this.showTrace;
            }
        }
    });
</script>
