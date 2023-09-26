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
    import { defineComponent, PropType } from "vue";

    export default defineComponent({
        name: "DataSource",
        props: {
            config: {
                type: Object as PropType<DataSourceConfig>,
                required: true
            },
            datasets: {
                type: Array as PropType<DatasetConfig[]>,
                required: true
            },
            value: {
                type: String as PropType<string>,
                required: true
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
