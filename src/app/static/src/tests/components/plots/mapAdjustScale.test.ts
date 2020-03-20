import {mount, shallowMount} from '@vue/test-utils';
import MapAdjustScale from "../../../app/components/plots/MapAdjustScale.vue";
import {ColourScaleType} from "../../../app/store/plottingSelections/plottingSelections";

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

    it("emits update event when type changes", () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Default,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        wrapper.find("#type-input-custom").trigger("click");

        expect(wrapper.emitted("update").length).toBe(1);
        expect(wrapper.emitted("update")[0][0]).toStrictEqual({
            type: ColourScaleType.Custom,
            customMin: 0,
            customMax: 1
        });

        wrapper.find("#type-input-default").trigger("click");

        expect(wrapper.emitted("update").length).toBe(2);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ColourScaleType.Default,
            customMin: 0,
            customMax: 1
        });
    });

    it("emits update event when custom min or max changes", () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        wrapper.find("#custom-min-input").setValue("0.5");
        wrapper.find("#custom-min-input").trigger("change");
        expect(wrapper.emitted("update").length).toBe(1);
        expect(wrapper.emitted("update")[0][0]).toStrictEqual({
            type: ColourScaleType.Custom,
            customMin: 0.5,
            customMax: 1
        });

        wrapper.find("#custom-max-input").setValue("1.5");
        wrapper.find("#custom-max-input").trigger("keyup");
        expect(wrapper.emitted("update").length).toBe(2);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ColourScaleType.Custom,
            customMin: 0.5,
            customMax: 1.5
        });
    });

    it("does not emit update event when type is Custom and custom max is not greater than custom min", () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        wrapper.find("#custom-max-input").setValue("0");
        wrapper.find("#custom-max-input").trigger("change");
        expect(wrapper.emitted("update")).toBeUndefined();

        //Should emit event when change to default
        wrapper.find("#type-input-default").trigger("click");
        expect(wrapper.emitted("update").length).toBe(1);
    });

    it("updates colourScaleToAdjust when colourScale property changes", () => {
        const wrapper = mount(MapAdjustScale, {propsData: {
                show: true,
                colourScale: {
                    type: ColourScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        const newScale = {
            type: ColourScaleType.Default,
            customMin: 1,
            customMax: 2
        };
        wrapper.setProps({colourScale: newScale});

        expect((wrapper.vm as any).colourScaleToAdjust).toStrictEqual(newScale);

    });
});