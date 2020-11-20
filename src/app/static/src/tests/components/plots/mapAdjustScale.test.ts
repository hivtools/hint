import {mount, shallowMount} from '@vue/test-utils';
import MapAdjustScale from "../../../app/components/plots/MapAdjustScale.vue";
import {ScaleType} from "../../../app/store/plottingSelections/plottingSelections";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";

describe("MapAdjustScale component", () => {

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("does not render if show is false", () => {
        const wrapper = shallowMount(MapAdjustScale, {
            store, propsData: {
                show: false,
                colourScale: {}
            }
        });

        expect(wrapper.findAll("div").length).toBe(0);
    });

    it("renders as expected with default scale", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Default,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(true);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-full").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-filtered").element as HTMLInputElement).checked).toBe(false);

        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(true);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(true);
    });

    it("renders as expected with custom scale", () => {
        const wrapper = mount(MapAdjustScale, {store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(true);
        expect((wrapper.find("#type-input-dynamic-full").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-filtered").element as HTMLInputElement).checked).toBe(false);

        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(false);
        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).value).toBe("0");
        expect(wrapper.find("#custom-min-input").attributes("max")).toBe("1");
        expect(wrapper.find("#custom-min-input").attributes("step")).toBe("0.1");

        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(false);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).value).toBe("1");
        expect(wrapper.find("#custom-max-input").attributes("min")).toBe("0");
        expect(wrapper.find("#custom-max-input").attributes("step")).toBe("0.1");
        expect(wrapper.findAll("p").length).toBe(1);
        expect(wrapper.findAll("p").at(0).text()).toBe("");
    });

    it("renders as expected with full dynamic scale", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.DynamicFull,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-full").element as HTMLInputElement).checked).toBe(true);
        expect((wrapper.find("#type-input-dynamic-filtered").element as HTMLInputElement).checked).toBe(false);

        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(true);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(true);
    });

    it("renders scale input modifier when scale parameter given", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 100,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.DynamicFull,
                    customMin: 2,
                    customMax: 3
                }
            }
        });
        expect(wrapper.findAll("p").length).toBe(2);
        expect(wrapper.findAll("p").at(0).text()).toBe("x 100");
        expect(wrapper.findAll("p").at(1).text()).toBe("x 100");
    });

    it("renders as expected with filtered dynamic scale", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.DynamicFiltered,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        expect((wrapper.find("#type-input-default").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-custom").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-full").element as HTMLInputElement).checked).toBe(false);
        expect((wrapper.find("#type-input-dynamic-filtered").element as HTMLInputElement).checked).toBe(true);

        expect((wrapper.find("#custom-min-input").element as HTMLInputElement).disabled).toBe(true);
        expect((wrapper.find("#custom-max-input").element as HTMLInputElement).disabled).toBe(true);
    });

    const showAllProps = {
        metadata: {
            max: 2,
            min: 1,
            format: '',
            scale: 1,
            accuracy: null
        },
        show: true,
        step: 0.1,
        colourScale: {
            type: ScaleType.Custom,
            customMin: 0,
            customMax: 1
        }
    };

    it("renders as expected when hide props both false", () => {
        const wrapper = mount(MapAdjustScale, {store, propsData: showAllProps});

        expect(wrapper.find(".static-container").exists()).toBe(true);
        expect(wrapper.find(".static-default").exists()).toBe(true);
        expect(wrapper.find(".static-custom").exists()).toBe(true);
        expect(wrapper.find(".static-custom-values").exists()).toBe(true);
    });

    it("renders as expected when hide static defaults", () => {
        const propsData = {...showAllProps, hideStaticDefault: true};
        const wrapper = mount(MapAdjustScale, {store, propsData});

        expect(wrapper.find(".static-container").exists()).toBe(true);
        expect(wrapper.find(".static-default").exists()).toBe(false);
        expect(wrapper.find(".static-custom").exists()).toBe(true);
        expect(wrapper.find(".static-custom-values").exists()).toBe(true);
    });

    it("renders as expected when hide static custom", () => {
        const propsData = {...showAllProps, hideStaticCustom: true};
        const wrapper = mount(MapAdjustScale, {store, propsData});

        expect(wrapper.find(".static-container").exists()).toBe(true);
        expect(wrapper.find(".static-default").exists()).toBe(true);
        expect(wrapper.find(".static-custom").exists()).toBe(false);
        expect(wrapper.find(".static-custom-values").exists()).toBe(false);
    });

    it("renders as expected when hide static default and custom", () => {
        const propsData = {...showAllProps, hideStaticDefault: true, hideStaticCustom: true};
        const wrapper = mount(MapAdjustScale, {store, propsData});

        expect(wrapper.find(".static-container").exists()).toBe(false);
        expect(wrapper.find(".static-default").exists()).toBe(false);
        expect(wrapper.find(".static-custom").exists()).toBe(false);
        expect(wrapper.find(".static-custom-values").exists()).toBe(false);
    });

    it("emits update event when type changes", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Default,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        wrapper.find("#type-input-custom").trigger("click");

        expect(wrapper.emitted("update").length).toBe(1);
        expect(wrapper.emitted("update")[0][0]).toStrictEqual({
            type: ScaleType.Custom,
            customMin: 0,
            customMax: 1
        });

        wrapper.find("#type-input-default").trigger("click");

        expect(wrapper.emitted("update").length).toBe(2);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ScaleType.Default,
            customMin: 0,
            customMax: 1
        });

        wrapper.find("#type-input-dynamic-full").trigger("click");

        expect(wrapper.emitted("update").length).toBe(3);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ScaleType.DynamicFull,
            customMin: 0,
            customMax: 1
        });

        wrapper.find("#type-input-dynamic-filtered").trigger("click");

        expect(wrapper.emitted("update").length).toBe(4);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ScaleType.DynamicFiltered,
            customMin: 0,
            customMax: 1
        });
    });

    it("emits update event when custom min or max changes", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        wrapper.find("#custom-min-input").setValue("0.5");
        wrapper.find("#custom-min-input").trigger("change");
        expect(wrapper.emitted("update").length).toBe(1);
        expect(wrapper.emitted("update")[0][0]).toStrictEqual({
            type: ScaleType.Custom,
            customMin: 0.5,
            customMax: 1
        });

        wrapper.find("#custom-max-input").setValue("1.5");
        wrapper.find("#custom-max-input").trigger("keyup");
        expect(wrapper.emitted("update").length).toBe(2);
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({
            type: ScaleType.Custom,
            customMin: 0.5,
            customMax: 1.5
        });
    });

    it("does not emit update event when type is Custom and custom max is not greater than custom min", () => {
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Custom,
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
        const wrapper = mount(MapAdjustScale, {
            store, propsData: {
                metadata: {
                    max: 2,
                    min: 1,
                    format: '',
                    scale: 1,
                    accuracy: null
                },
                show: true,
                step: 0.1,
                colourScale: {
                    type: ScaleType.Custom,
                    customMin: 0,
                    customMax: 1
                }
            }
        });

        const newScale = {
            type: ScaleType.Default,
            customMin: 1,
            customMax: 2
        };
        wrapper.setProps({colourScale: newScale});

        expect((wrapper.vm as any).colourScaleToAdjust).toStrictEqual(newScale);

    });
});
