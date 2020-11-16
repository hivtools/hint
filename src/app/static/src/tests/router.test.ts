import {router} from '../app/router';
import {storeOptions} from "../app/root";

const baselineActions = {
    getBaselineData: jest.fn()
};

const surveyAndProgramActions = {
    getSurveyAndProgramData: jest.fn()
};

const modelRunActions = {
    getResult: jest.fn()
};

const projectActions = {
    getCurrentProject: jest.fn()
};

const actions = {
    getADRSchemas: jest.fn()
}

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.modelRun!!.actions = modelRunActions;
storeOptions.modules!!.projects!!.actions = projectActions;
storeOptions.actions = actions

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import {app} from "../app";
import Stepper from "../app/components/Stepper.vue";
import Projects from "../app/components/projects/Projects.vue";

describe("Router", () => {

    afterAll(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("has expected properties", () => {
        expect(app.$router).toBe(router);
        expect(router.mode).toBe("history");
        expect(router.getMatchedComponents("/")).toStrictEqual([Stepper]);
        expect(router.getMatchedComponents("/projects")).toStrictEqual([Projects]);
    });
});
