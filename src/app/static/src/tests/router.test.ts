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

const genericChartActions = {
    getGenericChartMetadata: jest.fn()
};

const actions = {
    getADRSchemas: jest.fn()
};

storeOptions.modules!!.baseline!!.actions = baselineActions;
storeOptions.modules!!.surveyAndProgram!!.actions = surveyAndProgramActions;
storeOptions.modules!!.modelRun!!.actions = modelRunActions;
storeOptions.modules!!.projects!!.actions = projectActions;
storeOptions.modules!!.genericChart!!.actions = genericChartActions;
storeOptions.actions = actions

console.error = jest.fn();

// only import the app after we have replaced action with mocks
// as the app will call these actions on import
import app from "../app";
import {beforeEnter} from "../app/router"
import Stepper from "../app/components/Stepper.vue";
import Projects from "../app/components/projects/Projects.vue";
import {store} from "../app/main";
import {RouteLocationNormalized} from "vue-router";
import { mount } from '@vue/test-utils'

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

    it("doesn't redirect returning guest to login page", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        const next = jest.fn();

        store.state.currentUser = "guest";
        Storage.prototype.getItem = jest.fn((key) => key === "asGuest" ? "continueAsGuest" : null);

        beforeEnter({} as RouteLocationNormalized, {} as RouteLocationNormalized);

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

        beforeEnter({} as RouteLocationNormalized, {} as RouteLocationNormalized);

        expect(window.location.assign).toHaveBeenCalledTimes(1);
        expect(window.location.assign).toHaveBeenCalledWith("/login");
        expect(next).not.toBeCalled();

        window.location = realLocation
    });

    it("does not redirect to login page for authenticated user", () => {
        const realLocation = window.location
        delete (window as any).location
        window.location = {...realLocation, assign: jest.fn()};

        const next = jest.fn();
        store.state.currentUser = "test.user@example.com";

        beforeEnter({} as RouteLocationNormalized, {} as RouteLocationNormalized);

        expect(window.location.assign).not.toHaveBeenCalled();
        expect(next).toBeCalled();

        window.location = realLocation
    });
});
