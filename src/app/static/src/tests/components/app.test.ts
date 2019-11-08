import {createLocalVue, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from "vue";
import {mockAxios, mockSuccess} from "../mocks";

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
mockAxios.onGet(`/model/options/`)
    .reply(200, mockSuccess({controlSections: []}));

import {app} from "../../app"
import {mutations} from "../../app/store/root/mutations";
import {RootState, storeOptions} from "../../app/root";
import {localStorageManager} from "../../app/localStorageManager";

describe("App", () => {

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
        store.commit("baseline/PopulationUploadError", {payload: "test"});

        await Vue.nextTick();
        expect(spy).toHaveBeenCalled();
    });

});
