import {shallowMount} from '@vue/test-utils';
import MapLegend from "../../../../app/components/plots/MapLegend.vue";

describe("Map legend component", () => {

    const wrapper = shallowMount(MapLegend, {
        propsData: {
            metadata: {
                max: 2,
                min: 1,
                colour: "interpolateGreys",
                invert_scale: false
            }
        }
    });

    it("renders 6 levels", () => {
        const levels = wrapper.findAll("i");
        expect(levels.length).toBe(6)
    });

    it("calculates 6 levels from max and min", () => {
        const levels = wrapper.findAll(".level");
        expect(levels.at(0).text()).toBe("1");
        expect(levels.at(1).text()).toBe("1.2");
        expect(levels.at(2).text()).toBe("1.4");
        expect(levels.at(3).text()).toBe("1.6");
        expect(levels.at(4).text()).toBe("1.8");
        expect(levels.at(5).text()).toBe("2");
    });

    it("renders icons with colors", () => {
        const icons = wrapper.findAll("i");
        expect(icons.at(0).element.style
            .getPropertyValue("background")).toBe("rgb(255, 255, 255)");
        expect(icons.at(4).element.style
            .getPropertyValue("background")).toBe("rgb(64, 64, 64)");
        expect(icons.at(5).element.style
            .getPropertyValue("background")).toBe("rgb(0, 0, 0)");

    });

    it("renders icons with colors, with scale inverted", () => {
        const invertedWrapper = shallowMount(MapLegend, {
            propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    colour: "interpolateGreys",
                    invert_scale: true
                }
            }
        });

        const icons = invertedWrapper.findAll("i");
        expect(icons.at(0).element.style
            .getPropertyValue("background")).toBe("rgb(0, 0, 0)");
        expect(icons.at(4).element.style
            .getPropertyValue("background")).toBe("rgb(226, 226, 226)");
        expect(icons.at(5).element.style
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
    })

});
