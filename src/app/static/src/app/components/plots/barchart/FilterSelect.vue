<template>
    <div>
        <label class="font-weight-bold">{{label}}</label>
        <tree-select :instanceId="id"
                     :multiple=isXAxisOrDisagg
                     :clearable="false"
                     :flat=isXAxisOrDisagg
                     :options="options"
                     :value="selectedValues"
                     @select="select"
                     @deselect="deselect"></tree-select>
        <span v-if="isXAxisOrDisagg" class="text-muted">
                        <small v-translate="badge"></small>
                    </span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FilterOption} from "../../../generated";
    import TreeSelect from '@riophae/vue-treeselect';

    interface Props {
        id: string
        options: FilterOption[]
        isXAxis: boolean
        isDisaggregateBy: boolean
        value: any[]
        label: string
    }

    const props = {
        id: String,
        options: Array,
        isXAxis: Boolean,
        isDisaggregateBy: Boolean,
        value: Array,
        label: String
    };

    interface Data {
        selected: any
    }

    interface Computed {
        isXAxisOrDisagg: boolean,
        selectedValues: any[]
        badge: string
    }

    export default Vue.extend<Data, any, Computed, Props>({
        props,
        data() {
            return {
                selected: (this.isXAxis || this.isDisaggregateBy) ? this.value : [this.value[0]]
            }
        },
        methods: {
            select(node: FilterOption) {
                if (!this.isXAxisOrDisagg) {
                    this.selected = [node]
                } else {
                    this.selected.push(node);
                }
                this.$emit("input", this.selected);
            },
            deselect(node: FilterOption) {
                this.selected = this.selected.filter((n: any) => n.id != node.id);
                this.$emit("input", this.selected);
            }
        },
        computed: {
            isXAxisOrDisagg() {
                return this.isXAxis || this.isDisaggregateBy
            },
            selectedValues() {
                return this.value.map((v: any) => v.id);
            },
            badge() {
                if (this.isXAxis) {
                    return ("xAxis");
                } else {
                    return "disaggBy"
                }
            }
        },
        watch: {
          isXAxisOrDisagg() {
              if (!this.isXAxisOrDisagg) {
                  //When we go from multi-select to single-select, update 'selected'
                  if (this.selected.length > 1) {
                      this.selected = [this.selected[0]];
                  }
                  if (this.selected.length == 0){
                      this.selected.push(this.options[0]);
                  }
                  this.$emit("input", this.selected);
              }
          }
        },
        components: {
            TreeSelect
        }
    })
</script>