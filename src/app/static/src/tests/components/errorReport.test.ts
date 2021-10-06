import {shallowMount, mount} from '@vue/test-utils';
import ErrorReport from "../../app/components/ErrorReport.vue";
import Modal from "../../app/components/Modal.vue";
import Vuex from "vuex";
import {mockRootState, mockStepperState} from "../mocks";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {StepperState} from "../../app/store/stepper/stepper";

describe("Error report component", () => {

    const createStore = (stepperState: Partial<StepperState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState)
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("modal is open when prop is true", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(true);
    });

    it("modal is closed when prop is false", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: false
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(false);
    });

    it("renders steps as options with project, login and other as extra sections", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });
        const options = wrapper.findAll("option");

        expect(options.length).toBe(10);
        expect(options.at(0).text()).toBe("Upload inputs");
        expect(options.at(1).text()).toBe("Review inputs");
        expect(options.at(6).text()).toBe("Save results");
        expect(options.at(7).text()).toBe("Login");
        expect(options.at(8).text()).toBe("Projects");
        expect(options.at(9).text()).toBe("Other");

        expect((options.at(0).element as HTMLOptionElement).value).toBe("uploadInputs");
        expect((options.at(1).element as HTMLOptionElement).value).toBe("reviewInputs");
        expect((options.at(6).element as HTMLOptionElement).value).toBe("downloadResults");
        expect((options.at(7).element as HTMLOptionElement).value).toBe("login");
        expect((options.at(8).element as HTMLOptionElement).value).toBe("projects");
        expect((options.at(9).element as HTMLOptionElement).value).toBe("other");
    });

    it("selects current step by default", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({activeStep: 2})
        });

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("reviewInputs")
    });

    it("can update section", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({activeStep: 2})
        });

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("reviewInputs");

        wrapper.find("#section").setValue("downloadResults");

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("downloadResults");
        expect(wrapper.vm.$data.section).toBe("downloadResults");
        expect((wrapper.vm as any).currentSection).toBe("downloadResults");
    });

    it("emits close event on cancel", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(".btn-white").text()).toBe("Cancel");
        wrapper.find(".btn-white").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("emits close event on send", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(".btn-red").text()).toBe("Send");
        wrapper.find(".btn-red").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("resets data on cancel", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        wrapper.find("#description").setValue("something");
        wrapper.find("#reproduce").setValue("reproduce steps");
        wrapper.find("#section").setValue("downloadResults");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.reproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.section).toBe("downloadResults");

        wrapper.find(".btn-white").trigger("click");

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.reproduce).toBe("");
        expect(wrapper.vm.$data.section).toBe("");
    });

    it("resets data on send", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        wrapper.find("#description").setValue("something");
        wrapper.find("#reproduce").setValue("reproduce steps");
        wrapper.find("#section").setValue("downloadResults");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.reproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.section).toBe("downloadResults");

        wrapper.find(".btn-red").trigger("click");

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.reproduce).toBe("");
        expect(wrapper.vm.$data.section).toBe("");
    });


});
