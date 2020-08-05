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

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.modelRun!!.actions = modelRunActions;

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import {app} from "../app";
import Stepper from "../app/components/Stepper.vue";
import Versions from "../app/components/versions/Versions.vue";

describe("Router", () => {

    afterAll(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("has expected properties", () => {
        expect(app.$router).toBe(router);
        expect(router.mode).toBe("history");
        expect(router.getMatchedComponents("/")).toStrictEqual([Stepper]);
        expect(router.getMatchedComponents("/versions")).toStrictEqual([Versions]);
    });
});
