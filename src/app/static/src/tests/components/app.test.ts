import {createLocalVue, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockAxios, mockModelRunState, mockStepperState, mockSuccess, mockSurveyAndProgramState} from "../mocks";
import {mockBaselineState} from "../mocks";
import {mutations as baselineMutations} from "../../app/store/baseline/mutations";
import {baselineGetters} from "../../app/store/baseline/baseline";
import {surveyAndProgramGetters} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {getters} from "../../app/store/stepper/getters";
import {mutations as stepperMutations} from "../../app/store/stepper/mutations";
import {actions as stepperActions} from "../../app/store/stepper/actions";
import {actions} from "../../app/store/root/actions";

const localVue = createLocalVue();
localVue.use(Vuex);

// mock requests made by the root vue instance before it is imported
mockAxios.onGet(`/baseline/pjnz/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/baseline/shape/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/baseline/population/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/disease/survey/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/disease/programme/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/disease/anc/`)
    .reply(200, mockSuccess(null));

import {app} from "../../app"
import {mutations} from "../../app/store/root/mutations";

describe("App", () => {

    const baselineActions = {
        getBaselineData: jest.fn()
    };

    const surveyAndProgramActions = {
        getSurveyAndProgramData: jest.fn()
    };

    const store = new Vuex.Store({
        modules: {
            baseline: {
                namespaced: true,
                state: mockBaselineState(),
                actions: {...baselineActions},
                mutations: {...baselineMutations},
                getters: {...baselineGetters}
            },
            surveyAndProgram: {
                namespaced: true,
                state: mockSurveyAndProgramState(),
                getters: {...surveyAndProgramGetters},
                actions: surveyAndProgramActions
            },
            selectedData: {
                namespaced: true,
                state: {state: null},
            },
            modelRun: {
                namespaced: true,
                state: mockModelRunState()
            },
            stepper: {
                namespaced: true,
                state: mockStepperState(),
                actions: stepperActions,
                mutations: stepperMutations,
                getters
            }
        },
        actions,
        mutations
    });

    it("loads input data on mount", (done) => {

        let c = app.$options;
        mount({
            beforeMount: c.beforeMount,
            methods: c.methods,
            render: c.render
        }, {store});

        setTimeout(() => {
            expect(baselineActions.getBaselineData).toHaveBeenCalled();
            expect(surveyAndProgramActions.getSurveyAndProgramData).toHaveBeenCalled();
            done();
        });
    });

});