import {actions} from "../../app/store/modelOptions/actions";
import {login, rootState} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyActions} from "../../app/store/surveyAndProgram/actions";
import {isDynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import { ModelOptionsMutation } from "../../app/store/modelOptions/mutations";
import { mockAxios, mockModelOptionsState } from "../mocks";
import Axios from "axios";

const fs = require("fs");
const FormData = require("form-data");

describe("model options actions integration", () => {

    beforeAll(async () => {
        await login();

        const commit = jest.fn();
        const dispatch = jest.fn();
        let file = fs.createReadStream("../testdata/malawi.geojson");
        let formData = new FormData();
        formData.append('file', file);

        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);

        file = fs.createReadStream("../testdata/survey.csv");
        formData = new FormData();
        formData.append('file', file);

        await surveyActions.uploadSurvey({commit, dispatch, rootState} as any, formData);
    });

    it("can get valid model options", async () => {
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit, rootState} as any);
        expect(commit.mock.calls[1][0]["type"]).toBe("ModelOptionsFetched");
        const payload = commit.mock.calls[1][0]["payload"];
        expect(isDynamicFormMeta(payload)).toBe(true);

        expect(commit.mock.calls[2][0]["type"]).toBe("SetModelOptionsVersion");
        expect(commit.mock.calls[2][0]["payload"]).toBeDefined();
    });
/*
    it("can validate model options", async () => {
        const commit = jest.fn();
        const options = jest.fn()
        const version = jest.fn();
    
        await mockAxios.onPost("/model/validate/options",{options, version}).reply(200, "Success")
        //await actions.validateModelOptions({commit, mockState, rootState} as any, {options,version} as any);

        expect(commit.mock.calls[1][0]["type"]).toBe(ModelOptionsMutation.Validate);
        //const payload = commit.mock.calls[1][0]["payload"];
        //expect(payload).toBe(false);
    });
    */
    
});
