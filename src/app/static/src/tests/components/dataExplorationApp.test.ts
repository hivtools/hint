import {mount, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import {DataExplorationState, storeOptions} from "../../app/store/dataExploration/dataExploration";

const baselineActions = {
    getBaselineData: jest.fn()
};

const surveyAndProgramActions = {
    getSurveyAndProgramData: jest.fn()
};

const adrActions = {
    getSchemas: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.adr!!.actions = adrActions;

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import {dataExplorationApp} from "../../app/dataExploration"
import {LanguageMutation} from "../../app/store/language/mutations";
import {Language} from "../../app/store/translations/locales";

describe("Data Exploration App", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    afterAll(() => {
        (console.log as jest.Mock).mockClear();
        (console.error as jest.Mock).mockClear();
    });

    const getStore = (ready: boolean = false) => {
        const localStoreOptions = {...storeOptions};
        localStoreOptions.modules!!.baseline.state.ready = ready;
        localStoreOptions.modules!!.surveyAndProgram.state.ready = ready;
        return new Vuex.Store<DataExplorationState>(localStoreOptions);
    };

    it("loads input data on mount", (done) => {
        const store = getStore();
        let c = dataExplorationApp.$options;
        mount({
            beforeMount: c.beforeMount,
            methods: c.methods,
            render: c.render
        }, {store});

        setTimeout(() => {
            expect(baselineActions.getBaselineData).toHaveBeenCalled();
            expect(surveyAndProgramActions.getSurveyAndProgramData).toHaveBeenCalled();
            expect(adrActions.getSchemas).toHaveBeenCalled();
            done();
        });
    });

    it("gets language from state", () => {
        const store = getStore();
        let c = dataExplorationApp.$options;
        const rendered = shallowMount({
            computed: c.computed,
            template: "<div :class='language'></div>"
        }, {store});

        expect(rendered.classes()).toContain("en");
    });

    it("updates html lang when language changes", () => {
        const store = getStore();
        let c = dataExplorationApp.$options;
        const rendered = shallowMount({
            computed: c.computed,
            template: "<div :class='language'></div>",
            watch: c.watch
        }, {store});

        store.commit(LanguageMutation.ChangeLanguage, {payload: Language.pt});

        expect(document.documentElement.lang).toBe("pt");
    });

});
