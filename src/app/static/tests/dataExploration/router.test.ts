import {router} from '../../app/router';
import {storeOptions} from "../../app/store/dataExploration/dataExploration";

const baselineActions = {
    getBaselineData: jest.fn()
};

const surveyAndProgramActions = {
    getSurveyAndProgramData: jest.fn()
};

const genericChartActions = {
    getGenericChartMetadata: jest.fn()
};

const actions = {
    getADRSchemas: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.genericChart!!.actions = genericChartActions;
storeOptions.actions = actions

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import {dataExplorationApp, beforeEnter} from "../../app/dataExploration";
import {store} from "../../app/dataExploration";
import {Route} from "vue-router";
import Accessibility from "../../app/components/Accessibility.vue";
import DataExploration from "../../app/components/dataExploration/DataExploration.vue";

describe("Router", () => {

    afterAll(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("has expected properties", () => {
        expect(dataExplorationApp.$router).toBe(router);
        expect(router.mode).toBe("history");
        expect(router.getMatchedComponents("/callback/explore")).toStrictEqual([DataExploration])
        expect(router.getMatchedComponents("/accessibility")).toStrictEqual([Accessibility]);
    });

    it("doesn't redirect returning guest to login page", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        const next = jest.fn();

        store.state.currentUser = "guest";
        Storage.prototype.getItem = jest.fn((key) => key === "asGuest" ? "continueAsGuest" : null);

        beforeEnter({} as Route, {} as Route, next);

        expect(window.location.assign).not.toHaveBeenCalled();
        expect(next).toBeCalled();

        window.location = realLocation
    });

    it("redirects to login page if user is not a returning guest", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        const next = jest.fn();
        store.state.currentUser = "guest";
        Storage.prototype.getItem = jest.fn();

        beforeEnter({} as Route, {} as Route, next);

        expect(window.location.assign).toHaveBeenCalledTimes(1);
        expect(window.location.assign).toHaveBeenCalledWith("/login?redirectTo=explore");
        expect(next).not.toBeCalled();

        window.location = realLocation
    });

    it("does not redirect to login page for authenticated user", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        const next = jest.fn();
        store.state.currentUser = "test.user@example.com";

        beforeEnter({} as Route, {} as Route, next);

        expect(window.location.assign).not.toHaveBeenCalled();
        expect(next).toBeCalled();

        window.location = realLocation
    });
});
