<template>
    <div>
        <div class="form-group">
            <h4><label :for="`data-source-${config.id}`" v-translate="config.label"></label></h4>
            <select v-model="selected" :id="`data-source-${config.id}`" class="form-control">
                <option v-for="ds in datasets" :key="ds.id" :value="ds.id" v-translate="ds.label"></option>
            </select>
        </div>
    </div>
</template>

<script lang="ts">
    import {DatasetConfig, DataSourceConfig} from "../../../types";
    import Vue from "vue";

    interface Props {
        config: DataSourceConfig,
        datasets: DatasetConfig[],
        value: string
    }

    interface Computed {
        selected: string
    }

    export default Vue.extend<unknown, unknown, Computed, Props>( {
        name: "DataSource",
        props: {
            config: {
                type: Object
            },
            datasets: {
                type: Array
            },
            value: {
                type: String
            }
        },
        computed: {
            selected: {
                get() {
                    return this.value;
                },
                set(newValue: string) {
                    this.$emit('update', newValue)
                }
            }
        }
    });
</script>
