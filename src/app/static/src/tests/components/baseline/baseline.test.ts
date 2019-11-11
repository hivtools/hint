import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {BaselineActions} from "../../../app/store/baseline/actions";
import {mockBaselineState, mockMetadataState, mockPopulationResponse, mockShapeResponse} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import Baseline from "../../../app/components/baseline/Baseline.vue";
import FileUpload from "../../../app/components/FileUpload.vue";
import {BaselineMutations} from "../../../app/store/baseline/mutations";
import {MetadataState} from "../../../app/store/metadata/metadata";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Baseline upload component", () => {

    let actions: jest.Mocked<BaselineActions>;
    let mutations: jest.Mocked<BaselineMutations>;

    const createSut = (baselineState?: Partial<BaselineState>, metadataState?: Partial<MetadataState>) => {

        actions = {
            uploadPJNZ: jest.fn(),
            getBaselineData: jest.fn(),
            uploadShape: jest.fn(),
            uploadPopulation: jest.fn(),
            validate: jest.fn()
        };

        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    actions: {...actions},
                    mutations: {...mutations}
                },
                metadata: {
                    namespaced: true,
                    state: mockMetadataState(metadataState)
                }
            }
        })
    };

    it("pjnz is not valid if country is not present", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(false);
        expect(wrapper.findAll(FileUpload).at(0).findAll("label").length).toBe(0);
    });

    it("pjnz is valid if country is present", () => {
        const store = createSut({country: "Malawi"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(true);
    });

    it("country name is passed to file upload component if country is present", () => {
        const store = createSut({country: "Malawi"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).find("label").text()).toBe("Country: Malawi");
    });

    it("passes pjnz error to file upload", () => {
        const store = createSut({pjnzError: "File upload went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().error).toBe("File upload went wrong");
    });

    it("shows metadata error if present", () => {
        const store = createSut({}, {plottingMetadataError: "Metadata went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().error).toBe("Metadata went wrong");
    });

    it("shows pjnz error, not metadata error, if both are present", () => {
        const store = createSut({pjnzError: "File upload went wrong"},
                                {plottingMetadataError: "Metadata went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().error).toBe("File upload went wrong");
    });

    it("shows baseline error if present", () => {
        const store = createSut({baselineError: "Baseline is inconsistent"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.find(ErrorAlert).props().message).toEqual("Baseline is inconsistent")
    });

    it("shows baseline validating indicator", () => {
        const store = createSut({validating: true});
        const wrapper = shallowMount(Baseline, {store, localVue});
        const validating = wrapper.find("#baseline-validating");
        expect(validating.text()).toEqual("Validating...")
        expect(validating.findAll(LoadingSpinner).length).toEqual(1)
    });

    it("shape is not valid if shape is not present", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(1).props().valid).toBe(false);
    });

    it("shape is valid if shape is present", () => {
        const store = createSut({shape: mockShapeResponse()});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(1).props().valid).toBe(true);
    });

    it("passes shape error to file upload", () => {
        const store = createSut({shapeError: "File upload went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(1).props().error).toBe("File upload went wrong");
    });

    it("population is not valid if population is not present", () => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(2).props().valid).toBe(false);
    });

    it("population is valid if population is present", () => {
        const store = createSut({population: mockPopulationResponse()});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(2).props().valid).toBe(true);
    });

    it("passes population error to file upload", () => {
        const store = createSut({populationError: "File upload went wrong"});
        const wrapper = shallowMount(Baseline, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(2).props().error).toBe("File upload went wrong");
    });

    it("upload pjnz dispatches baseline/uploadPJNZ", (done) => {
        expectUploadToDispatchAction(0, () => actions.uploadPJNZ, done);
    });

    it("upload shape dispatches baseline/uploadShape", (done) => {
        expectUploadToDispatchAction(1, () => actions.uploadShape, done);
    });

    it("upload population dispatches baseline/uploadPopulation", (done) => {
        expectUploadToDispatchAction(2, () => actions.uploadPopulation, done);
    });

    const expectUploadToDispatchAction = (index: number,
                                          action: () => jest.MockInstance<any, any>,
                                          done: jest.DoneCallback) => {
        const store = createSut();
        const wrapper = shallowMount(Baseline, {store, localVue});

        wrapper.findAll(FileUpload).at(index).props().upload({name: "TEST"});
        setTimeout(() => {
            expect(action().mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    }
});
