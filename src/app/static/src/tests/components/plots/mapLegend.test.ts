import {shallowMount} from '@vue/test-utils';
import MapLegend from "../../../app/components/plots/MapLegend.vue";

describe("Map legend component", () => {

    const wrapper = shallowMount(MapLegend, {
        propsData: {
            max: 2,
            min: 1,
            getColor: (i: number) => "fake-color-" + i
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
        const icons = wrapper.findAll(".hidden");
        // theres a bug with vue-test-utils that means
        // we can't access the v-bind:style property
        // to check this properly
        expect(icons.at(0).text()).toContain("fake-color-1");
        expect(icons.at(5).text()).toContain("fake-color-2");
    });

});
