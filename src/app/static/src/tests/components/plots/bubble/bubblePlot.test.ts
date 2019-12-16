import {createLocalVue, shallowMount, Wrapper} from "@vue/test-utils";
import Vue from 'vue';
import BubblePlot from "../../../../app/components/plots/bubble/BubblePlot.vue";
import {LGeoJson, LCircleMarker, LTooltip} from "vue2-leaflet";
import {getRadius} from "../../../../app/components/plots/bubble/utils";
import {getColor} from "../../../../app/store/filteredData/utils";
import MapControl from "../../../../app/components/plots/MapControl.vue";

const localVue = createLocalVue();

const propsData = {
    features: [
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_3_1", "area_name": "North", "area_level": 3, "center_x": 35.7082, "center_y": -15.2046}
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_4_1", "area_name": "North West", "area_level": 4, "center_x": 35.7083, "center_y": -15.2047}
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI_4_2", "area_name": "North East", "area_level": 4, "center_x": 35.7084, "center_y": -15.2048}
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
});