import {mount, shallowMount, WrapperArray} from '@vue/test-utils';
import MapAdjustScale from "../../../app/components/plots/MapAdjustScale.vue";
import {ColourScaleType} from "../../../app/store/colourScales/colourScales";

describe("MapAdjustScale component", () => {

    it("does not render if show is false", () => {
        const wrapper = shallowMount(MapAdjustScale, {propsData: {
                show: false,
                colourScale: {}
            }
        });

        expect(wrapper.findAll("div").length).toBe(0);
    });

    it("renders as expected with default scale",  () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Default,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(true);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(true);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(true);
    });

    it("renders as expected with custom scale", () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(true);
        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(false);
        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).value).toBe("0");
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(false);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).value).toBe("1");
    });
});