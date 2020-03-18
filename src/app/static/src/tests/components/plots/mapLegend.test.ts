import {shallowMount, WrapperArray} from '@vue/test-utils';
import MapLegend from "../../../app/components/plots/MapLegend.vue";
import {Vue} from "vue/types/vue";
import {ColourScaleType} from "../../../app/store/colourScales/colourScales";
import MapAdjustScale from "../../../app/components/plots/MapAdjustScale.vue";

describe("Map legend component", () => {

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
            }
        }
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

    it("renders icons with colors", () => {
        const icons = wrapper.findAll("i");
        expectIcons(icons);
    });

    it("renders correctly with custom colour scale", () => {
        const rangeWrapper = shallowMount(MapLegend,{
            propsData: {
                metadata: {
                    max: 10,
                    min: 0,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourScale: {
                    type: ColourScaleType.Custom,
                    customMin: 1,
                    customMax: 2
                }
            }
        });

        const levels = rangeWrapper.findAll(".level");
        expectLevels(levels);
        const icons = rangeWrapper.findAll("i");
        expectIcons(icons);
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
                }
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
                }
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
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: false
                },
                colourScale
            }
        });

        const adjust = wrapper.find(MapAdjustScale);
        expect(adjust.props().show).toBe(false);
        expect(adjust.props().colourScale).toBe(colourScale);

        const showAdjust = wrapper.find("#adjust-scale a");
        showAdjust.trigger("click");
        expect(adjust.props().show).toBe(true);
        expect(showAdjust.text()).toBe("Done");

        showAdjust.trigger("click");
        expect(adjust.props().show).toBe(false);
        expect(showAdjust.text()).toBe("Adjust scale");
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
                colourScale: {type: ColourScaleType.Default}
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
