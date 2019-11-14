import {actions} from "../../app/store/modelOptions/actions";
import {login} from "./integrationTest";
import {isDynamicFormMeta} from "../../app/components/forms/dynamicFormChecker";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyActions} from "../../app/store/surveyAndProgram/actions";

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

        await baselineActions.uploadShape({commit, dispatch} as any, formData);

        file = fs.createReadStream("../testdata/survey.csv");
        formData = new FormData();
        formData.append('file', file);

        await surveyActions.uploadSurvey({commit, dispatch} as any, formData);
    });

    it("can get valid model options", async () => {
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
        const payload = commit.mock.calls[0][0]["payload"];
        expect(isDynamicFormMeta(payload)).toBe(true);
    })
});
