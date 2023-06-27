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

const genericChartActions = {
    getGenericChartMetadata: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.adr!!.actions = adrActions;
storeOptions.modules!!.genericChart!!.actions = genericChartActions;

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import HintDataExploration from '../../app/components/HintDataExploration.vue';
import {LanguageMutation} from "../../app/store/language/mutations";
import {Language} from "../../app/store/translations/locales";
import { nextTick } from 'vue';

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
        mount(HintDataExploration, {
            global: {
                plugins: [store]
            }
        });

        setTimeout(() => {
            expect(baselineActions.getBaselineData).toHaveBeenCalled();
            expect(surveyAndProgramActions.getSurveyAndProgramData).toHaveBeenCalled();
            expect(adrActions.getSchemas).toHaveBeenCalled();
            expect(genericChartActions.getGenericChartMetadata).toHaveBeenCalled();
            done();
        });
    });

    it("gets language from state", () => {
        const store = getStore();
        const rendered = shallowMount(HintDataExploration, {
            global: {
                plugins: [store]
            }
        });

        expect((rendered.vm as any).language).toBe("en");
    });

    it("updates html lang when language changes", async () => {
        const div = document.createElement('div');
        div.id = 'root';
        document.body.appendChild(div);

        const store = getStore();
        const rendered = shallowMount(HintDataExploration, {
            global: {
                plugins: [store]
            },
            attachTo: "#root"
        });

        store.commit(LanguageMutation.ChangeLanguage, {payload: Language.pt});
        await nextTick();

        expect(document.documentElement.lang).toBe("pt");
    });

});
