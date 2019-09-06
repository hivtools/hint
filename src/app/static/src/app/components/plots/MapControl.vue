<template>
    <l-control position="topright">
    <div style="width: 250px;" class="p-3 map-control">
        <form>
            <div class="row form-group">
                <label class="col-3 col-form-label">
                    Indicator:
                </label>
                <div class="col">
                    <tree-select v-model="indicator"
                                 :multiple="false"
                                 :options="indicatorOptions"></tree-select>
                </div>
            </div>
            <div class="row form-group">
                <label class="col-3 col-form-label">
                    Detail:
                </label>
                <div class="col">
                    <tree-select v-model="detail"
                                 :multiple="false"
                                 :options="detailOptions"></tree-select>
                </div>
            </div>
        </form>
    </div>
    </l-control>
</template>

<script type="ts">
    import Vue from "vue";
    import TreeSelect from '@riophae/vue-treeselect'
    import {LControl} from 'vue2-leaflet';

    interface Data {
        detail: any;
        detailOptions: any[];
        indicator: string,
        indicatorOptions: any[]
    }

    export default Vue.extend({
        name: 'MapControl',
        components: {
            TreeSelect,
            LControl
        },
        data(): Data {
            return {
                detail: 4,
                detailOptions: [
                    {
                        id: 1,
                        label: "Admin level 1"
                    },
                    {
                        id: 2,
                        label: "Admin level 2"
                    },
                    {
                        id: 3,
                        label: "Admin level 3"
                    },
                    {
                        id: 4,
                        label: "Admin level 4"
                    },
                    {
                        id: 5,
                        label: "Admin level 5"
                    }
                ],
                indicator: "prev",
                indicatorOptions: [
                    {id: "prev", label: "prevalence"},
                    {id: "art", label: "ART coverage"}
                ]
            }
        }
    });
</script>