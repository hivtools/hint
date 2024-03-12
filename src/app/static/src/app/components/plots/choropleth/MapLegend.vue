<template>
    <l-control position="bottomright">
        <div class="legend-container">
            <map-adjust-scale v-if="showAdjust"
                              class="legend-element legend-adjust map-control"
                              name="colour">
            </map-adjust-scale>
            <div class="legend-element map-control p-3">
                <label>{{indicatorMetadata.name}}</label>
                <div class="legend" v-for="(level, index) in scaleLevels" v-bind:key="index">
                    <i v-bind:style="level.style"></i>
                    <span class="level">{{ level.val }}</span>
                    <span class="hidden" style="display: none">{{ level.style }}</span>
                    <br/>
                </div>
                <div v-if="!!colourScales" class="adjust-scale mt-1">
                    <a @click="toggleAdjust" href="">
                        <span v-if="showAdjust" v-translate="'done'"></span>
                        <span v-if="!showAdjust" v-translate="'adjustScale'"></span>
                    </a>
                </div>
            </div>
        </div>
    </l-control>
</template>

<script lang="ts">

import {computed, defineComponent, PropType, ref} from "vue";
import {LControl} from "@vue-leaflet/vue-leaflet";
import MapAdjustScale from "./MapAdjustScale.vue";
import {useStore} from "vuex";
import {RootState} from "../../../root";
import {NumericRange} from "../../../types";
import {ChoroplethIndicatorMetadata} from "../../../generated";

export default defineComponent({
    props: {
        indicatorMetadata: {
            type: Object as PropType<ChoroplethIndicatorMetadata>,
            required: true
        },
        colourRange: {
            type: Object as PropType<NumericRange>,
            required: true
        },
        scaleLevels: {
            type: Object,
            required: true
        }
    },
    setup(props) {
        const store = useStore<RootState>();
        const indicatorMetadata = computed(() => {
            return store.getters["modelCalibrate/indicatorMetadata"];
        });
        const colourScales = computed(() => {
            return store.state.plotState.output.colourScales;
        });

        const showAdjust = ref<boolean>(false);

        const toggleAdjust = (e: Event) => {
            e.preventDefault();
            showAdjust.value = !showAdjust.value;
        };

        return {
            indicatorMetadata,
            colourScales,
            showAdjust,
            toggleAdjust
        }
    },
    components: {
        LControl,
        MapAdjustScale
    }
})
</script>
