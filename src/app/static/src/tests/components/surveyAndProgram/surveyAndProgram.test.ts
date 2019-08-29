import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import FileUpload from "../../../app/components/FileUpload.vue";
import {SurveyAndProgramDataState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {SurveyAndProgramMutations} from "../../../app/store/surveyAndProgram/mutations";
import {mockSurveyAndProgramState} from "../../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Survey and program component", () => {

    let actions: jest.Mocked<SurveyAndProgramActions>;
    let mutations: jest.Mocked<SurveyAndProgramMutations>;

    const createSut = (state?: Partial<SurveyAndProgramDataState>) => {

        actions = {
            uploadSurvey: jest.fn(),
            _uploadSurvey: jest.fn()
        };

        return new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(state),
                    actions: {...actions},
                    mutations: {...mutations}
                }
            }
        })
    };

    it("survey upload is valid if surveyGeoJson is present", () => {
        const store = createSut({
            surveyGeoJson: {
                "type": "FeatureCollection",
                "features": []
            }
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(true);
    });

    it("survey upload is invalid if surveyGeoJson is null", () => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().valid).toBe(false);
    });

    it("passes survey upload error to file upload", () => {
        const store = createSut({surveyError: "File upload went wrong"});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(0).props().error).toBe("File upload went wrong");
    });

    it("upload survey dispatches surveyAndProgram/uploadSurvey", (done) => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        wrapper.findAll(FileUpload).at(0).props().upload({name: "TEST"});
        setTimeout(() => {
            expect(actions.uploadSurvey.mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    });
});
