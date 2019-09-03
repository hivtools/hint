import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import FileUpload from "../../../app/components/FileUpload.vue";
import {SurveyAndProgramDataState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {SurveyAndProgramMutations} from "../../../app/store/surveyAndProgram/mutations";
import {mockSurveyAndProgramState} from "../../mocks";

export function testUploadComponent(name: string, position: number) {

    const localVue = createLocalVue();
    Vue.use(Vuex);

    let actions: jest.Mocked<SurveyAndProgramActions>;
    let mutations: jest.Mocked<SurveyAndProgramMutations>;
    let expectedAction: any;

    const createSut = (state?: Partial<SurveyAndProgramDataState>) => {

        actions = {
            uploadSurvey: jest.fn(),
            uploadProgram: jest.fn(),
            uploadANC: jest.fn()
        };

        switch (name) {
            case "survey":
                expectedAction = actions.uploadSurvey;
                break;
            case "program":
                expectedAction = actions.uploadProgram;
                break;
            case "anc":
                expectedAction = actions.uploadANC;
                break;
        }

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

    let errorState: object;
    switch (name) {
        case "survey":
            errorState = {surveyError: "File upload went wrong"};
            break;
        case "program":
            errorState = {programError: "File upload went wrong"};
            break;
        case "anc":
            errorState = {ancError: "File upload went wrong"};
            break;
    }

    const response = {
        filename: "filename.csv",
        type: name as any,
        data: "SOME DATA"
    };


    let successState: object;
    switch (name) {
        case "survey":
            successState = {
                survey: response
            };
            break;
        case "program":
            successState = {
                program: response
            };
            break;
        case "anc":
            successState = {
                anc: response
            };
            break;
    }


    it(`${name} upload is valid if data is present`, () => {
        const store = createSut(successState);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(position).props().valid).toBe(true);
    });

    it(`${name} upload is invalid if data is null`, () => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(position).props().valid).toBe(false);
    });

    it(`passes ${name} upload error to file upload`, () => {
        const store = createSut(errorState);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(FileUpload).at(position).props().error).toBe("File upload went wrong");
    });

    it(`upload ${name} dispatches surveyAndProgram/upload${name}`, (done) => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        wrapper.findAll(FileUpload).at(position).props().upload({name: "TEST"});
        setTimeout(() => {
            expect(expectedAction.mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    });
}


