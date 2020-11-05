import {actions} from "../../app/store/modelOptions/actions";
import {login, rootState} from "./integrationTest";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyActions} from "../../app/store/surveyAndProgram/actions";
import {isDynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import { ModelOptionsMutation } from "../../app/store/modelOptions/mutations";
import { Language } from "../../app/store/translations/locales";

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

    
    it("can validate model options", async () => {
        const commit = jest.fn();
        const options =  {
        anc_prevalence_year1:"2018",
        anc_art_coverage_year1 : "2018",
        anc_prevalence_year2 : "2018",
        area_level : "4",
        area_scope : "MWI",
        artattend : "false",
        artattend_log_gamma_offset : -4,
        artattend_t2 : "true",
        calendar_quarter_t1 : "CY2018Q3",
        calendar_quarter_t2 : "CY2019Q4",
        calendar_quarter_t3 : "CY2020Q3"
       }
        const version = jest.fn()
      
        const mockState = {
            language: Language.en,
            modelOptions: {
                options: {},
                version: {}
            }
        }
        //passed mock params which will return validation error
        await actions.validateModelOptions({commit, rootState: mockState} as any, {options,version} as any);
        expect(commit.mock.calls[0][0]).toBe(ModelOptionsMutation.LoadUpdatedOptions);
        expect(commit.mock.calls[1][0]["type"]).toBe(ModelOptionsMutation.HasValidationError);
        expect(commit.mock.calls[1][0]["payload"]["error"]).toBe("INVALID_INPUT")

    });
});