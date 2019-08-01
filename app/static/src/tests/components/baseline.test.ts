import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {BaselineActions} from "../../app/store/baseline/actions";
import {mutations} from "../../app/store/baseline/mutations";
import {mockBaselineState, mockFileList} from "../mocks";
import {BaselineState} from "../../app/store/baseline/baseline";
import Baseline from "../../app/components/baseline/Baseline.vue";
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import Tick from "../../app/components/Tick.vue";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Baseline upload component", () => {

    let actions: jest.Mocked<BaselineActions>;

    const createSut = (baselineState?: Partial<BaselineState>) => {

        actions = {
            uploadPJNZ: jest.fn()
        };

        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    actions: {...actions},
                    mutations: {...mutations}
                }
            }
        })
    };

    it("does not render tick if country is not present", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

    it("renders tick if country is present", () => {
        const store = createSut({country: "Malawi"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(Tick).length).toBe(1);
    });

    it("renders error message if hasError", () => {
        const store = createSut({pjnzError: "File upload went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.find(ErrorAlert).props().message).toBe("File upload went wrong");
    });

    it("does not render error message if not hasError", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(ErrorAlert).length).toBe(0);
    });

    // TODO this is a massive pain - you can't programatically create a FileList
    // not sure of the best solution
    // https://github.com/jsdom/jsdom/issues/1272
    xit("dispatches baseline/uploadPJNZ when file is selected", (done) => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});

        (wrapper.find("input").element as HTMLInputElement).files = mockFileList("TEST");

        wrapper.find("input").trigger("change");

        setTimeout(() => {
            expect(actions.uploadPJNZ.mock.calls[0][1]).toBe("TEST");
            done();
        });

    });

    it("dispatches baseline/uploadPJNZ", (done) => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

        setTimeout(() => {
            expect(actions.uploadPJNZ.mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    });
});
