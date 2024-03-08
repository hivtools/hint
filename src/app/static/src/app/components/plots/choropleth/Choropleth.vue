<template>
    <div>
        {{ plotData }}
        <l-map ref="map" style="height: 800px; width: 100%" @ready="updateBounds">
            <l-geo-json v-for="feature in currentFeatures" ref="featureRefs"
                        :key="feature.properties.area_id"
                        :geojson="feature">
            </l-geo-json>
            <reset-map @reset-view="updateBounds"></reset-map>
            <map-legend></map-legend>
        </l-map>
    </div>

</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref} from "vue";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {PlotData} from "../../../store/plotData/plotData";
import { LMap, LGeoJson } from "@vue-leaflet/vue-leaflet";
import { Feature } from "geojson";
import {getVisibleFeatures} from "./utils";
import ResetMap from "./ResetMap.vue";
import MapLegend from "./MapLegend.vue";
import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";

export default defineComponent({
    props: {
        selections: {
            type: Object as PropType<ChoroplethSelections>,
            required: true
        },
    },
    setup(props) {
        const map = ref<typeof LMap | null>(null);
        const featureRefs = ref<typeof LGeoJson[]>([]);
        const store = useStore<RootState>();
        const plotData = computed<PlotData>(() => store.state.plotData.choropleth);

        const features = store.state.baseline.shape ?
                store.state.baseline.shape.data.features as Feature[] : [] as Feature[];

        const currentFeatures = computed(() => {
            const selectedLevel = store.state.plotSelections.choropleth.filters
                    .find(f => f.stateFilterId === "detail")!.selection;
            const selectedAreas = store.state.plotSelections.choropleth.filters
                    .find(f => f.stateFilterId === "area")!.selection;
            return getVisibleFeatures(features, selectedLevel, selectedAreas);
        });

        const updateBounds = () => {
            if (currentFeatures.value.length > 0) {
                map.value?.leafletObject.fitBounds(featureRefs.value.map(f => f.leafletObject.getBounds()));
            }
        }

        return {
            map,
            featureRefs,
            plotData,
            currentFeatures,
            updateBounds
        }
    },
    components: {
        LMap,
        LGeoJson,
        ResetMap,
        MapLegend
    }

})
</script>
