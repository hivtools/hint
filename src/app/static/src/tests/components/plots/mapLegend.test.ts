import {createLocalVue, shallowMount, WrapperArray} from '@vue/test-utils';
import MapLegend from "../../../app/components/plots/MapLegend.vue";
import {Vue} from "vue/types/vue";
import {ColourScaleType} from "../../../app/store/plottingSelections/plottingSelections";
import MapAdjustScale from "../../../app/components/plots/MapAdjustScale.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

describe("Map legend component", () => {

    const colourRange = {
        max: 2,
        min: 1
    };

    const wrapper = shallowMount(MapLegend, {
        propsData: {
            metadata: {
                max: 2,
                min: 1,
                colour: "interpolateGreys",
                invert_scale: false
            },
            colourScale: {
                type: ColourScaleType.Default,
                customMin: 1.5,
                customMax: 2.5
            },
            colourRange
        }, localVue
    });

    const expectLevels = (levels: WrapperArray<Vue>) => {
        expect(levels.length).toBe(6);
        expect(levels.at(0).text()).toBe("2");
        expect(levels.at(1).text()).toBe("1.8");
        expect(levels.at(2).text()).toBe("1.6");
        expect(levels.at(3).text()).toBe("1.4");
        expect(levels.at(4).text()).toBe("1.2");
        expect(levels.at(5).text()).toBe("1");
    };

    const expectIcons = (icons: WrapperArray<Vue>) => {
        expect(icons.at(5).element.style
            .getPropertyValue("background")).toBe("rgb(255, 255, 255)");
        expect(icons.at(1).element.style
            .getPropertyValue("background")).toBe("rgb(64, 64, 64)");
        expect(icons.at(0).element.style
            .getPropertyValue("background")).toBe("rgb(0, 0, 0)");
    };

    it("calculates 6 levels from min to max", () => {
        const levels = wrapper.findAll(".level");
        expectLevels(levels);
    });

    it("calculates 6 levels from min to max with negative min", () => {
        const rangeWrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourRange: { min: -0.45, max: 0}
            }
        });
        const levels = rangeWrapper.findAll(".level");
        expect(levels.length).toBe(6);

        expect(levels.at(0).text()).toBe("0");
        expect(levels.at(1).text()).toBe("-0.09");
        expect(levels.at(2).text()).toBe("-0.18");
        expect(levels.at(3).text()).toBe("-0.27");
        expect(levels.at(4).text()).toBe("-0.36");
        expect(levels.at(5).text()).toBe("-0.45");
    });

    it("calculates single level when max equals min", () => {
        const rangeWrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourRange: {min: 3, max: 3}
            }
        });
        const levels = rangeWrapper.findAll(".level");
        expect(levels.length).toBe(1);
        expect(levels.at(0).text()).toBe("3");

        const icons = rangeWrapper.findAll("i");
        expect(icons.length).toBe(1);
        expect(icons.at(0).element.style
            .getPropertyValue("background")).toBe("rgb(255, 255, 255)");
    });

    it("renders icons with colors", () => {
        const icons = wrapper.findAll("i");
        expectIcons(icons);
    });

    it("does not render adjust link if no colour scale", () => {
        const noScaleWrapper = shallowMount(MapLegend, {
            propsData: {
                    metadata: {
                        max: 10,
                        min: 0,
                        colour: "interpolateGreys",
                        invert_scale: false
                    },
                    colourScale: null,
                    colourRange
                    },
                });
        expect(wrapper.find("#adjust-scales").exists()).toBe(false);
    });

    it("renders icons with colors, with scale inverted", () => {
        const invertedWrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: true
                },
                colourScale: {
                    type: ColourScaleType.Default
                },
                colourRange
            }
        });

        const icons = invertedWrapper.findAll("i");
        expect(icons.at(5).element.style
            .getPropertyValue("background")).toBe("rgb(0, 0, 0)");
        expect(icons.at(1).element.style
            .getPropertyValue("background")).toBe("rgb(226, 226, 226)");
        expect(icons.at(0).element.style
            .getPropertyValue("background")).toBe("rgb(255, 255, 255)");

    });

    it("returns no levels if no metadata", () => {
        const emptyWrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: null
            }
        });
        expect(emptyWrapper.findAll("i").length).toBe(0);
        expect(emptyWrapper.findAll(".level").length).toBe(0);
    });

    it("formats big numbers", () => {
        const wrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 60000,
                    min: 1000,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourScale: {
                    type: ColourScaleType.Default
                },
                colourRange: {max: 60000, min: 1000}
            }
        });
        const levels = wrapper.findAll(".level");
        expect(levels.at(0).text()).toBe("60k");
        expect(levels.at(5).text()).toBe("1k");
    });

    it("toggles show adjust scale", () => {
        const colourScale = {
            type: ColourScaleType.Default
        };

        const wrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 20,
                    min: 0,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourRange,
                colourScale
            }
        });

        const adjust = wrapper.find(MapAdjustScale);
        expect(adjust.props().show).toBe(false);
        expect(adjust.props().colourScale).toBe(colourScale);
        expect(adjust.props().step).toBe(2);

        const showAdjust = wrapper.find("#adjust-scale a");
        expect(showAdjust.find("span").text()).toBe("Adjust scale");

        showAdjust.trigger("click");
        expect(adjust.props().show).toBe(true);
        expect(showAdjust.find("span").text()).toBe("Done");

        showAdjust.trigger("click");
        expect(adjust.props().show).toBe(false);
        expect(showAdjust.find("span").text()).toBe("Adjust scale");
    });

    it("emits update event when scale changes", () => {
        const wrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 20,
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourScale: {type: ColourScaleType.Default},
                colourRange
            }
        });

        const newColourScale = {
            type: ColourScaleType.Custom,
            customMin: 0,
            customMax: 1
        };

        const adjust = wrapper.find(MapAdjustScale);
        adjust.vm.$emit("update", newColourScale);

        expect(wrapper.emitted("update").length).toBe(1);
        expect(wrapper.emitted("update")[0][0]).toBe(newColourScale);
    });
});
