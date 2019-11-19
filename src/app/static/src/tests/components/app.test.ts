import {createLocalVue, mount} from '@vue/test-utils';
import Vuex, {Store} from 'vuex';
import {ReadyState, RootState, storeOptions} from "../../app/root";
import {localStorageManager} from "../../app/localStorageManager";
import {prefixNamespace} from "../../app/utils";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {ModelOptionsMutation} from "../../app/store/modelOptions/mutations";

const baselineActions = {
    getBaselineData: jest.fn()
};

const surveyAndProgramActions = {
    getSurveyAndProgramData: jest.fn()
};

const modelRunActions = {
    getResult: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.modelRun!!.actions = modelRunActions;

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import {app} from "../../app"

const localVue = createLocalVue();
localVue.use(Vuex);

describe("App", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const getStore = (ready: boolean = false) => {
        const localStoreOptions = {...storeOptions};
        localStoreOptions.modules!!.baseline.state.ready = ready;
        localStoreOptions.modules!!.surveyAndProgram.state.ready = ready;
        localStoreOptions.modules!!.modelRun.state.ready = ready;
        return new Vuex.Store<RootState>(localStoreOptions);
    };

    it("loads input data on mount", (done) => {
        const store = getStore();
        let c = app.$options;
        mount({
            beforeMount: c.beforeMount,
            methods: c.methods,
            render: c.render
        }, {store});

        setTimeout(() => {
            expect(baselineActions.getBaselineData).toHaveBeenCalled();
            expect(surveyAndProgramActions.getSurveyAndProgramData).toHaveBeenCalled();
            expect(modelRunActions.getResult).toHaveBeenCalled();
            done();
        });
    });

    it("updates local storage on every mutation", () => {
        const store = getStore();
        const spy = jest.spyOn(localStorageManager, "saveState");
        store.commit(prefixNamespace("baseline", BaselineMutation.PopulationUploadError), {payload: "test"});

        expect(spy).toHaveBeenCalled();
    });

    it("resets inputs if baseline update mutation is called and state is ready", () => {
        const store = getStore(true);
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("baseline", BaselineMutation.PJNZUpdated), {payload: null});

        expect(spy.mock.calls[1][0]).toBe("ResetInputs");
        expect(spy.mock.calls[2][0]).toBe("ResetOptions");
        expect(spy.mock.calls[3][0]).toBe("ResetOutputs");

        expect(spy).toBeCalledTimes(4);
    });


    it("resets inputs if surveyAndProgram update mutation is called and state is ready", () => {
        const store = getStore(true);
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("surveyAndProgram", SurveyAndProgramMutation.SurveyUpdated), {payload: null});

        expect(spy.mock.calls[1][0]).toBe("ResetInputs");
        expect(spy.mock.calls[2][0]).toBe("ResetOptions");
        expect(spy.mock.calls[3][0]).toBe("ResetOutputs");

        expect(spy).toBeCalledTimes(4);
    });

    it("resets outputs if modelOptions update mutation is called and state is ready", () => {
        const store = getStore(true);
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("modelOptions", ModelOptionsMutation.Update), {payload: null});

        expect(spy.mock.calls[1][0]).toBe("ResetOutputs");
        expect(spy).toBeCalledTimes(2);
    });

    it("does not commit any reset mutations if state is not ready", () => {
        const store = getStore();
        const spy = jest.spyOn(store, "commit");
        store.commit(prefixNamespace("modelOptions", ModelOptionsMutation.Update), {payload: null});
        store.commit(prefixNamespace("surveyAndProgram", SurveyAndProgramMutation.SurveyUpdated), {payload: null});
        store.commit(prefixNamespace("baseline", BaselineMutation.PJNZUpdated), {payload: null});

        expect(spy).toBeCalledTimes(3);
    });

    it("does not commit any reset mutations if only one module state is ready", () => {
        const store = getStore();
        expectModuleBeingReadyIsNotEnough(store.state.baseline, store);
        expectModuleBeingReadyIsNotEnough(store.state.surveyAndProgram, store);
        expectModuleBeingReadyIsNotEnough(store.state.modelRun, store);
    });

    it("does not commit any reset mutations if only 2 module states are ready", () => {
        const store = getStore();
        expectTwoModulesBeingReadyIsNotEnough([store.state.baseline, store.state.surveyAndProgram], store);
        expectTwoModulesBeingReadyIsNotEnough([store.state.baseline, store.state.modelRun], store);
        expectTwoModulesBeingReadyIsNotEnough([store.state.modelRun, store.state.surveyAndProgram], store);
    });

    function expectModuleBeingReadyIsNotEnough(module: ReadyState, store: Store<RootState>) {
        // make module ready
        module.ready = true;

        // reset mocks from previous call
        jest.resetAllMocks();
        const spy = jest.spyOn(store, "commit");

        store.commit(prefixNamespace("modelOptions", ModelOptionsMutation.Update), {payload: null});

        // reset module for next test
        module.ready = false;

        expect(spy).toBeCalledTimes(1);
    }

    function expectTwoModulesBeingReadyIsNotEnough(modules: ReadyState[], store: Store<RootState>) {
        // make modules ready
        modules.forEach(m => m.ready = true);

        // reset mocks from previous call
        jest.resetAllMocks();
        const spy = jest.spyOn(store, "commit");

        store.commit(prefixNamespace("modelOptions", ModelOptionsMutation.Update), {payload: null});

        // reset modules for next test
        modules.forEach(m => m.ready = true);

        expect(spy).toBeCalledTimes(1);
    }

});
