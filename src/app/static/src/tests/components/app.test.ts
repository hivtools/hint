import {createLocalVue, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from "vue";
import {mockAxios, mockSuccess} from "../mocks";
import {app} from "../../app"
import {RootState, storeOptions} from "../../app/root";
import {localStorageManager} from "../../app/localStorageManager";
import {prefixNamespace} from "../../app/utils";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {ModelOptionsMutation} from "../../app/store/modelOptions/mutations";

const localVue = createLocalVue();
localVue.use(Vuex);

// mock requests made by the root vue instance before it is imported
mockAxios.onGet(`/baseline/pjnz/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/baseline/shape/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/baseline/population/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/baseline/validate/`)
    .reply(200, mockSuccess({complete: true, consistent: true}));
mockAxios.onGet(`/disease/survey/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/disease/programme/`)
    .reply(200, mockSuccess(null));
mockAxios.onGet(`/disease/anc/`)
    .reply(200, mockSuccess(null));

describe("App", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const baselineActions = {
        getBaselineData: jest.fn()
    };

    const surveyAndProgramActions = {
        getSurveyAndProgramData: jest.fn()
    };

    const localStoreOptions = storeOptions;
    localStoreOptions.modules!!.baseline!!.actions = baselineActions;
    localStoreOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;

    const store = new Vuex.Store<RootState>(localStoreOptions);

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

    it("updates local storage on every mutation", async () => {

        const spy = jest.spyOn(localStorageManager, "saveState");
        store.commit(prefixNamespace("baseline", BaselineMutation.PopulationUploadError), {payload: "test"});

        await Vue.nextTick();
        expect(spy).toHaveBeenCalled();
    });

    it("resets inputs if baseline update mutation is called", async () => {
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("baseline", BaselineMutation.PJNZUpdated), {payload: null});

        await Vue.nextTick();
        expect(spy.mock.calls[1][0]).toBe("ResetInputs");
        expect(spy.mock.calls[2][0]).toBe("ResetOptions");
        expect(spy.mock.calls[3][0]).toBe("ResetOutputs");

        expect(spy.mock.calls.length).toBe(4);
    });


    it("resets inputs if surveyAndProgram update mutation is called", async () => {
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("surveyAndProgram", SurveyAndProgramMutation.SurveyUpdated), {payload: null});

        await Vue.nextTick();
        expect(spy.mock.calls[1][0]).toBe("ResetInputs");
        expect(spy.mock.calls[2][0]).toBe("ResetOptions");
        expect(spy.mock.calls[3][0]).toBe("ResetOutputs");

        expect(spy.mock.calls.length).toBe(4);

    });

    it("resets outputs if modelOptions update mutation is called", async () => {
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("modelOptions", ModelOptionsMutation.Update), {payload: null});

        await Vue.nextTick();
        expect(spy.mock.calls[1][0]).toBe("ResetOutputs");
        expect(spy.mock.calls.length).toBe(2);
    });

});
