import {defineComponent, PropType, Ref, ref} from "vue";
import {expect, it, vi} from "vitest";
import {shallowMount} from "@vue/test-utils";
import {IndicatorValuesDict} from "../../../../app/types";
import {IndicatorMetadata} from "../../../../app/generated";
import {Feature} from "geojson";
import {LGeoJson} from "@vue-leaflet/vue-leaflet";
import {useChoroplethTooltips} from "../../../../app/components/plots/choropleth/useChoroplethTooltips";
import {mockIndicatorMetadata} from "../../../mocks";
import {Layer} from "leaflet";

describe("useChoroplethTooltips", () => {
    const TestComponent = defineComponent({
        props: {
            featureData: {
                type: Object as PropType<Ref<IndicatorValuesDict>>,
                required: true
            },
            indicatorMetadata: {
                type: Object as PropType<Ref<IndicatorMetadata>>,
                required: true
            },
            currentFeatures: {
                type: Object as PropType<Ref<Feature[]>>,
                required: true
            },
            featureRefs: {
                type: Object as PropType<Ref<typeof LGeoJson[]>>,
                required: true
            }
        },
        setup(props: any) {
            return {
                ...useChoroplethTooltips(
                    props.featureData,
                    props.indicatorMetadata,
                    props.currentFeatures,
                    props.featureRefs,
                    "en"
                )
            }
        }
    });

    const indicatorMetadata = ref<IndicatorMetadata>(mockIndicatorMetadata({
        format: "0.00%"
    }));
    const featureData = ref<IndicatorValuesDict>({
        MWI: {
            value: 0.25,
            lower_value: 0.20,
            upper_value: 0.30,
            color: "rgb(151, 151, 151)",
        },
    });
    const mockFeature = {
        properties: {
            area_id: 'MWI',
            area_name: 'Test Area'
        }
    } as any as Feature;
    const mockLayer = new (vi.fn(() => ({
        setTooltipContent: vi.fn(),
        bindTooltip: vi.fn()
    })) as unknown as { new(): Layer })();
    const featureRefs = ref<typeof LGeoJson[]>([
        {
            geojson: mockFeature,
            leafletObject: {
                eachLayer: (fn: (layer: Layer) => void) => fn(mockLayer)
            }
        } as any as typeof LGeoJson
    ]);
    const currentFeatures = ref<Feature[]>([mockFeature]);

    const wrapper = shallowMount(TestComponent, {
        props: {
            featureData,
            indicatorMetadata,
            currentFeatures,
            featureRefs
        },
    });

    afterEach(() => {
        currentFeatures.value = [mockFeature];
        featureData.value = {
            MWI: {
                value: 0.25,
                lower_value: 0.20,
                upper_value: 0.30,
                color: "rgb(151, 151, 151)",
            }
        }
        vi.clearAllMocks();
    });

    it('binds tooltip to layer in createTooltips', () => {
        wrapper.vm.createTooltips.onEachFeature(mockFeature, mockLayer);

        expect(mockLayer.bindTooltip).toHaveBeenCalledTimes(1);
        expect(mockLayer.bindTooltip).toHaveBeenCalledWith(expect.stringContaining('Test Area'));
    });

    it('should not update tooltips if area_id is missing', () => {
        currentFeatures.value = [];
        wrapper.vm.updateTooltips();

        // As there are no valid area_ids, setTooltipContent should not be called.
        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(0);
    });

    it("updates tooltips when updateTooltips is called", () => {
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(1);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong><br>25.00%<br>(20.00% - 30.00%)</div>"
        );
    });

    it("shows just value if no bounds", () => {
        featureData.value = {
            MWI: {
                value: 0.25,
                lower_value: undefined,
                upper_value: undefined,
                color: "rgb(151, 151, 151)",
            }
        }
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(1);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong><br>25.00%</div>"
        );
    });

    it("shows just region name if no value", () => {
        featureData.value = {}
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(1);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong></div>"
        );
    });

    it("shows 0 values", () => {
        featureData.value = {
            MWI: {
                value: 0,
                lower_value: 0,
                upper_value: 0,
                color: "rgb(151, 151, 151)",
            }
        }
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(1);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong><br>0.00%<br>(0.00% - 0.00%)</div>"
        );
    });

    it("shows number of missing regions", () => {
        featureData.value = {
            MWI: {
                value: 0.25,
                lower_value: undefined,
                upper_value: undefined,
                color: "rgb(151, 151, 151)",
                missing_ids: ["MWI"]
            }
        }
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(1);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong><br>25.00%" +
            "<br>This value is missing from the uploaded data</div>"
        );

        featureData.value = {
            MWI: {
                value: 0.25,
                lower_value: undefined,
                upper_value: undefined,
                color: "rgb(151, 151, 151)",
                missing_ids: ["MWI.1", "MWI.2"]
            }
        }
        wrapper.vm.updateTooltips();

        expect(mockLayer.setTooltipContent).toHaveBeenCalledTimes(2);
        expect(mockLayer.setTooltipContent).toHaveBeenCalledWith(
            "<div><strong>Test Area</strong><br>25.00%" +
            "<br>This value is missing from the uploaded data</div>"
        );
    });
})
