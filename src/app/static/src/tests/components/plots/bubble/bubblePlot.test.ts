import {createLocalVue, shallowMount, Wrapper} from "@vue/test-utils";
import Vue from 'vue';
import BubblePlot from "../../../../app/components/plots/bubble/BubblePlot.vue";
import {LGeoJson, LCircleMarker, LTooltip} from "vue2-leaflet";
import {getFeatureIndicators, getRadius} from "../../../../app/components/plots/bubble/utils";
import {getColor} from "../../../../app/store/filteredData/utils";
import MapControl from "../../../../app/components/plots/MapControl.vue";

const localVue = createLocalVue();

const propsData = {
    features: [
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_3_1", "area_name": "North", "area_level": 3, "center_x": 35.7082, "center_y": -15.2046},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_4_1", "area_name": "North West", "area_level": 4, "center_x": 35.7083, "center_y": -15.2047},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_4_2", "area_name": "North East", "area_level": 4, "center_x": 35.7084, "center_y": -15.2048},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        }
    ],
    featureLevels: [
        {id: 3, display: true, area_level_label: "Admin Level 3"},
        {id: 4, display: true, area_level_label: "Admin Level 4"}
    ],
    chartdata: [
        {
            area_id: "MWI_3_1", plhiv: 1, prevalence: 0.01
        },
        {
            area_id: "MWI_4_1", plhiv: 10, prevalence: 0.1
        },
        {
            area_id: "MWI_4_2", plhiv: 20, prevalence: 0.2
        },
    ],
    indicators: [
        {
            indicator: "plhiv", value_column: "plhiv", name: "PLHIV", min: 1, max: 100, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 0.8, colour: "interpolateGreys", invert_scale: false
        }
    ]
};

const getWrapper  = () => {
    return shallowMount(BubblePlot, {propsData, localVue});
};

describe("BubblePlot component", () => {
    it("renders as expected", () => {
        const wrapper = getWrapper();
        const geoJsons = wrapper.findAll(LGeoJson);
        expect(geoJsons.length).toBe(2);
        expect(geoJsons.at(0).props().geojson).toBe(propsData.features[1]);
        expect(geoJsons.at(1).props().geojson).toBe(propsData.features[2]);

        const minArea = Math.PI * Math.pow(10, 2);
        const maxArea = Math.PI * Math.pow(10000, 2);

        const circles = wrapper.findAll(LCircleMarker);
        expect(circles.length).toBe(2);
        expect(circles.at(0).props().latLng).toEqual([-15.2047, 35.7083]);
        expect(circles.at(0).props().radius).toEqual(getRadius(10, 1, 100, minArea, maxArea));
        expect(circles.at(0).find(LTooltip).props().content).toEqual(`<div>
                            <strong>North West</strong>
                            <br/>Prevalence: 0.1
                            <br/>PLHIV: 10
                        </div>`);
        let color = getColor(0.1, propsData.indicators[1]);
        expect(circles.at(0).props().color).toEqual(color);
        expect(circles.at(0).props().fillColor).toEqual(color);

        expect(circles.at(1).props().latLng).toEqual([-15.2048, 35.7084]);
        expect(circles.at(1).props().radius).toEqual(getRadius(20, 1, 100, minArea, maxArea));
        expect(circles.at(1).find(LTooltip).props().content).toEqual(`<div>
                            <strong>North East</strong>
                            <br/>Prevalence: 0.2
                            <br/>PLHIV: 20
                        </div>`);
        color = getColor(0.2, propsData.indicators[1]);
        expect(circles.at(1).props().color).toEqual(color);
        expect(circles.at(1).props().fillColor).toEqual(color);

        expect(wrapper.find(MapControl).props().initialDetail).toEqual(4);
        expect(wrapper.find(MapControl).props().showIndicators).toEqual(false);
    });

    it("computes featureIndicators", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featureIndicators).toStrictEqual(getFeatureIndicators(propsData.chartdata,
            [propsData.features[1] as any, propsData.features[2] as any],
            propsData.indicators,
            10,
            10000));
    });

    it("computes featuresByLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featuresByLevel).toStrictEqual({
            3: [propsData.features[0]],
            4: [propsData.features[1], propsData.features[2]]
        });
    });

    it("computes maxLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.maxLevel).toBe(4);
    });

    it("computes currentFeatures", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.currentFeatures).toStrictEqual([propsData.features[1], propsData.features[2]]);
    });

    it("computes indicatorNameLookup", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.indicatorNameLookup).toStrictEqual({
            plhiv: "PLHIV",
            prevalence: "Prevalence"
        });
    });

    it("updateBounds updates bounds of map from features geojson", () => {
        const wrapper = getWrapper();
        const mockMapFitBounds = jest.fn();

        const vm = wrapper.vm as any;
        vm.$refs.map = {
            fitBounds: mockMapFitBounds
        };

        //NB we're not updating to selected features yet, just to current level
        vm.updateBounds();
        expect(mockMapFitBounds.mock.calls[0][0]).toStrictEqual(
            [
                {_northEast: {lat: -15.2047, lng: 35.7117}, _southWest: {lat: -15.2117, lng: 35.7083}},
                {_northEast: {lat: -15.2047, lng: 35.7117}, _southWest: {lat: -15.2117, lng: 35.7083}}
         ]);
    });

    it("updates detail", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onDetailChange(3);
        expect(vm.detail).toBe(3);
    })
});