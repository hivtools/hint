import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import FileUpload from "../../../app/components/FileUpload.vue";
import {SurveyAndProgramDataState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {SurveyAndProgramMutations} from "../../../app/store/surveyAndProgram/mutations";
import {mockSurveyAndProgramState} from "../../mocks";
import {ShapeResponse} from "../../../app/generated";

export function testUploadComponent(name: string, position: number) {

        const localVue = createLocalVue();
        Vue.use(Vuex);

        let actions: jest.Mocked<SurveyAndProgramActions>;
        let mutations: jest.Mocked<SurveyAndProgramMutations>;
        let expectedAction : any;

        const createSut = (state?: Partial<SurveyAndProgramDataState>) => {

            actions = {
                uploadSurvey: jest.fn(),
                uploadProgram: jest.fn()
            };

            expectedAction = name == "survey" ? actions.uploadSurvey : actions.uploadProgram;

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

        const errorState = name == "survey" ? {surveyError: "File upload went wrong"}
            : {programError: "File upload went wrong"};

        const shapeResponse: ShapeResponse = {
            filename: "survey.csv",
            type: "shape",
            data: {
                "type": "FeatureCollection",
                "features": []
            }
        };

        const successState = name == "survey" ? {
            survey: shapeResponse
        } : {
            program: shapeResponse
        };

        it("survey upload is valid if surveyGeoJson is present", () => {
            const store = createSut(successState);
            const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
            expect(wrapper.findAll(FileUpload).at(position).props().valid).toBe(true);
        });

        it("survey upload is invalid if surveyGeoJson is null", () => {
            const store = createSut();
            const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
            expect(wrapper.findAll(FileUpload).at(position).props().valid).toBe(false);
        });

        it("passes survey upload error to file upload", () => {
            const store = createSut(errorState);
            const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
            expect(wrapper.findAll(FileUpload).at(position).props().error).toBe("File upload went wrong");
        });

        it("upload survey dispatches surveyAndProgram/uploadSurvey", (done) => {
            const store = createSut();
            const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

            wrapper.findAll(FileUpload).at(position).props().upload({name: "TEST"});
            setTimeout(() => {
                expect(expectedAction.mock.calls[0][1]).toStrictEqual({name: "TEST"});
                done();
            });
        });
}


