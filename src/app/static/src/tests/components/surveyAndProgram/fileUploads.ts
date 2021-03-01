import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import ManageFile from "../../../app/components/files/ManageFile.vue";
import {SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {mockBaselineState, mockError, mockPlottingSelections, mockSurveyAndProgramState} from "../../mocks";

export function testUploadComponent(name: string, position: number) {

    const localVue = createLocalVue();

    let actions: jest.Mocked<SurveyAndProgramActions>;
    let mutations = {};
    let expectedUploadAction: any;
    let expectedDeleteAction: any;

    const createSut = (state?: Partial<SurveyAndProgramState>) => {

        actions = {
            importANC: jest.fn(),
            importProgram: jest.fn(),
            importSurvey: jest.fn(),
            uploadSurvey: jest.fn(),
            uploadProgram: jest.fn(),
            uploadANC: jest.fn(),
            deleteSurvey: jest.fn(),
            deleteProgram: jest.fn(),
            deleteANC: jest.fn(),
            deleteAll: jest.fn(),
            getSurveyAndProgramData: jest.fn(),
            selectDataType: jest.fn(),
            validateSurveyAndProgramData: jest.fn()
        };

        switch (name) {
            case "surveys":
                expectedUploadAction = actions.uploadSurvey;
                expectedDeleteAction = actions.deleteSurvey;
                break;
            case "program":
                expectedUploadAction = actions.uploadProgram;
                expectedDeleteAction = actions.deleteProgram;
                break;
            case "anc":
                expectedUploadAction = actions.uploadANC;
                expectedDeleteAction = actions.deleteANC;
                break;
        }

        return new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(state),
                    actions: {...actions},
                    mutations: {...mutations}
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState()
                },
                plottingSelections: {
                    namespaced: true,
                    state: mockPlottingSelections()
                }
            }
        })
    };

    let errorState: object;
    switch (name) {
        case "surveys":
            errorState = {surveyError: mockError("File upload went wrong")};
            break;
        case "program":
            errorState = {programError: mockError("File upload went wrong")};
            break;
        case "anc":
            errorState = {ancError: mockError("File upload went wrong")};
            break;
    }

    const response = {
        filename: "filename.csv",
        type: name as any,
        data: "SOME DATA"
    };


    let successState: object;
    switch (name) {
        case "surveys":
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
        expect(wrapper.findAll(ManageFile).at(position).props().valid).toBe(true);
    });

    it(`${name} upload is invalid if data is null`, () => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(position).props().valid).toBe(false);
    });

    it(`passes ${name} upload error to file upload`, () => {
        const store = createSut(errorState);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(ManageFile).at(position).props().error).toStrictEqual(mockError("File upload went wrong"));
    });

    it(`upload ${name} dispatches surveyAndProgram/upload${name}`, (done) => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        wrapper.findAll(ManageFile).at(position).props().upload({name: "TEST"});
        setTimeout(() => {
            expect(expectedUploadAction.mock.calls[0][1]).toStrictEqual({name: "TEST"});
            done();
        });
    });

    it(`delete ${name} dispatches surveyAndProgram/delete${name}`, (done) => {
        const store = createSut();
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        wrapper.findAll(ManageFile).at(position).props().deleteFile();
        setTimeout(() => {
            expect(expectedDeleteAction.mock.calls.length).toBe(1);
            done();
        });
    });
}


