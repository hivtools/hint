<script lang="ts">
    import Vue from "vue";
    import {Feature} from "geojson";
    import {LevelLabel, Filter} from "../../types";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {ColourScaleSelections} from "../../store/plottingSelections/plottingSelections";

    export interface Props {
        features: Feature[],
        featureLevels: LevelLabel[],
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        colourScales: ColourScaleSelections,
        areaFilterId: string,
    }

    export interface Computed {
        featuresByLevel: { [k: number]: Feature[] }
    }

    export const props = {
        features: {
            type: Array
        },
        featureLevels: {
            type: Array
        },
        indicators: {
            type: Array
        },
        chartdata: {
            type: Array
        },
        filters: {
            type: Array
        },
        colourScales: {
            type: Object
        },
        areaFilterId: {
            type: String
        }
    };

    export default Vue.extend<{}, {}, Computed, Props>({
        props: props,
        computed: {
            featuresByLevel() {
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const adminLevel = parseInt(feature.properties!!["area_level"]); //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push(feature);
                    }
                });

                return result;
            },
        }
    });
</script>