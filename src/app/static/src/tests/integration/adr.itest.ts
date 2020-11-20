import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyAndProgramActions} from "../../app/store/surveyAndProgram/actions";
import {login, rootState} from "./integrationTest";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {actions as rootActions} from "../../app/store/root/actions";
import {RootMutation} from "../../app/store/root/mutations";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {getFormData} from "./helpers";

// this suite tests all endpoints that talk to the ADR
// we put them in a suite of their own so that we can run
// them as a separate CI step and easily spot when test failures
// are related to ADR flakiness
describe("ADR related actions", () => {

    beforeAll(async () => {
        await login();
        // this key is for a test user who has access to 1 fake dataset
        const adrKey = "4c69b103-4532-4b30-8a37-27a15e56c0bb"
        await rootActions.saveADRKey({commit: jest.fn(), rootState} as any, adrKey)

        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("malawi.geojson");
        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);
    });

    it("can fetch ADR datasets", async () => {
        const commit = jest.fn();
        await rootActions.getADRDatasets({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(RootMutation.SetADRDatasets);
        expect(Array.isArray(commit.mock.calls[0][0]["payload"])).toBe(true);
    });

    it("can get dataset", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootStateWithSchemas = {
            ...rootState, adrSchemas: {
                baseUrl: "adr.com",
                pjnz: "pjnz",
                population: "pop",
                shape: "shape",
                survey: "survey",
                programme: "program",
                anc: "anc"
            }
        }
        await rootActions.getADRDatasets({commit, rootState} as any);
        const datasetId = commit.mock.calls[0][0]["payload"][0].id;
        const state = {selectedDataset: {id: datasetId}};
        await baselineActions.refreshDatasetMetadata({commit, state, dispatch, rootState: rootStateWithSchemas} as any);
        expect(commit.mock.calls[1][0]).toBe(BaselineMutation.UpdateDatasetResources);
    });

    it("can import PJNZ file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {country: "Malawi"} as any;
        await baselineActions.importPJNZ({commit, state, dispatch, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/Botswana2018.PJNZ");

        expect(commit.mock.calls[1][0]["type"]).toBe(BaselineMutation.PJNZUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("Botswana2018.PJNZ");
    }, 10000);

    it("can import shape file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        await baselineActions.importShape({commit, dispatch, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/malawi.geojson");

        expect(commit.mock.calls[1][0]["type"]).toBe(BaselineMutation.ShapeUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("malawi.geojson");

    }, 10000);

    it("can import population file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        await baselineActions.importPopulation({commit, dispatch, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/population.csv");

        expect(commit.mock.calls[1][0]["type"]).toBe(BaselineMutation.PopulationUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("population.csv");
    }, 7000);

    it("can import survey", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        await surveyAndProgramActions.importSurvey({commit, dispatch, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/survey.csv");

        expect(commit.mock.calls[1][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("survey.csv")
    }, 7000);

    it("can import programme", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        await surveyAndProgramActions.importProgram({commit, dispatch, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/programme.csv");

        expect(commit.mock.calls[1][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("programme.csv")
    }, 7000);

    it("can import anc", async () => {

        const commit = jest.fn();

        await surveyAndProgramActions.importANC({commit, rootState} as any,
            "https://raw.githubusercontent.com/mrc-ide/hint/master/src/app/testdata/anc.csv");

        expect(commit.mock.calls[1][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("anc.csv");
    }, 7000);

});
