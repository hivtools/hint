import {createLocalVue, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockAxios} from "../mocks";
import {mockBaselineState} from "../mocks";
import {mutations} from "../../app/store/baseline/mutations";

const localVue = createLocalVue();
localVue.use(Vuex);

// mock requests made by the root vue instance before it is imported
mockAxios.onGet(`/baseline/`)
    .reply(200, {pjnz: null});

import {app} from "../../app"

describe("App", () => {

    const actions = {
        uploadPJNZ: jest.fn(),
        getBaselineData: jest.fn()
    };

    const store = new Vuex.Store({
        modules: {
            baseline: {
                namespaced: true,
                state: mockBaselineState(),
                actions: {...actions},
                mutations: {...mutations}
            }
        }
    });

    it("loads baseline data on mount", (done) => {

        let c = app.$options;
        mount({
            beforeMount: c.beforeMount,
            methods: c.methods,
            render: c.render
        }, {store});

        setTimeout(() => {
            expect(actions.getBaselineData).toHaveBeenCalled();
            done();
        });
    })
});