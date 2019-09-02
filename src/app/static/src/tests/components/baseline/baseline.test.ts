import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {BaselineActions} from "../../../app/store/baseline/actions";
import {mockBaselineState} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import Baseline from "../../../app/components/baseline/Baseline.vue";
import FileUpload from "../../../app/components/FileUpload.vue";
import {BaselineMutations} from "../../../app/store/baseline/mutations";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Baseline upload component", () => {

    let actions: jest.Mocked<BaselineActions>;
    let mutations: jest.Mocked<BaselineMutations>;

    const createSut = (baselineState?: Partial<BaselineState>) => {

        actions = {
            uploadPJNZ: jest.fn(),
            getBaselineData: jest.fn()
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

    it("pjnz is not valid if country is not present", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(false);
    });

    it("pjnz is valid if country is present", () => {
        const store = createSut({country: "Malawi"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(true);
    });

    it("passes pjnz error to file upload", () => {
        const store = createSut({pjnzError: "File upload went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().error).toBe("File upload went wrong");
    });

    it("upload pjnz dispatches baseline/uploadPJNZ", (done) => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});

        wrapper.findAll(FileUpload).at(0).props().upload({name: "TEST"});
        setTimeout(() => {
            expect(actions.uploadPJNZ.mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    });
});
