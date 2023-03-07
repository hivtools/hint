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
    import {defineComponent} from "vue";
    import {DatasetConfig, DataSourceConfig} from "../../../types";

    interface Props {
        [key: string]: any
        config: DataSourceConfig,
        datasets: DatasetConfig[],
        value: string
    }

    interface Computed {
        [key: string]: any
        selected: {
            get(): string
            set: Function
        }
    }

    export default defineComponent<Props, unknown, {}, Computed>({
        name: "DataSource",
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
