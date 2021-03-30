import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as surveyAndProgramActions} from "../../app/store/surveyAndProgram/actions";
import {login, rootState} from "./integrationTest";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {actions as adrActions} from "../../app/store/adr/actions";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {getFormData} from "./helpers";
import {ADRMutation} from "../../app/store/adr/mutations";
import {UploadFile} from "../../app/types";
import {mockADRState} from "../mocks";

// this suite tests all endpoints that talk to the ADR
// we put them in a suite of their own so that we can run
// them as a separate CI step and easily spot when test failures
// are related to ADR flakiness
describe("ADR dataset-related actions", () => {
    const schemas = {
        baseUrl: "adr.com",
        pjnz: "pjnz",
        population: "pop",
        shape: "shape",
        survey: "survey",
    };

    beforeAll(async () => {
        await login();
        // this key is for a test user who has access to 1 fake dataset
        const adrKey = "4c69b103-4532-4b30-8a37-27a15e56c0bb"
        await adrActions.saveKey({commit: jest.fn(), rootState} as any, adrKey)

        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("malawi.geojson");
        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);
    });

    it("can fetch ADR datasets", async () => {
        const commit = jest.fn();
        await adrActions.getDatasets({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(ADRMutation.SetFetchingDatasets);
        expect(commit.mock.calls[0][0]["payload"]).toBe(true);

        expect(commit.mock.calls[1][0]["type"]).toBe(ADRMutation.SetADRError);
        expect(commit.mock.calls[1][0]["payload"]).toBe(null);

        expect(commit.mock.calls[2][0]["type"]).toBe(ADRMutation.SetDatasets);
        expect(Array.isArray(commit.mock.calls[2][0]["payload"])).toBe(true);

        expect(commit.mock.calls[3][0]["type"]).toBe(ADRMutation.SetFetchingDatasets);
        expect(commit.mock.calls[3][0]["payload"]).toBe(false);
    });

    it("can get dataset", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootStateWithSchemas = {
            ...rootState,
            adr: { schemas }
        };

        await adrActions.getDatasets({commit, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: ADRMutation.SetFetchingDatasets, payload: true});

        expect(commit.mock.calls[1][0]["type"]).toBe(ADRMutation.SetADRError);
        expect(commit.mock.calls[1][0]["payload"]).toBe(null);

        expect(commit.mock.calls[2][0].type).toStrictEqual(ADRMutation.SetDatasets);
        const datasetId = commit.mock.calls[2][0]["payload"][0].id;
        const state = {selectedDataset: {id: datasetId}};
        expect(commit.mock.calls[3][0]).toStrictEqual({type: ADRMutation.SetFetchingDatasets, payload: false});

        await baselineActions.refreshDatasetMetadata({commit, state, dispatch, rootState: rootStateWithSchemas} as any);
        expect(commit.mock.calls[4][0]).toBe(BaselineMutation.UpdateDatasetResources);
    });

    it("can get userCanUpload when selected dataset organisation is set", async () => {
        const commit = jest.fn();

        // 1. get datasets
        await adrActions.getDatasets({commit, rootState} as any);

        // 2. select a naomi dev dataset
        expect(commit.mock.calls[2][0].type).toStrictEqual(ADRMutation.SetDatasets);
        const datasets = commit.mock.calls[2][0]["payload"];
        const dataset = datasets.find((dataset: any) => dataset.organization.name === "naomi-development-team");
        expect(dataset).not.toBeNull()

        // 3. check can upload
        commit.mockClear();
        const root = {
            ...rootState,
            baseline: {
                selectedDataset: {
                    id: dataset.id,
                    organization: {id: dataset.organization.id}
                }
            }
        };
        const adr = { schemas, datasets }; //include datasets in adr state
        await adrActions.getUserCanUpload({commit, rootState: root, state: adr} as any);
        expect(commit.mock.calls[0][0].type).toBe(ADRMutation.SetUserCanUpload);
        expect(commit.mock.calls[0][0].payload).toBe(true);
    });

    it("can get dataset details on get userCanUpload when selected dataset organisation is not set", async () => {
        const commit = jest.fn();

        // 1. get datasets
        await adrActions.getDatasets({commit, rootState} as any);

        // 2. select a naomi dev dataset
        expect(commit.mock.calls[2][0].type).toStrictEqual(ADRMutation.SetDatasets);
        const datasets = commit.mock.calls[2][0]["payload"];
        const dataset = datasets.find((dataset: any) => dataset.organization.name === "naomi-development-team");
        expect(dataset).not.toBeNull()

        // 3. check can upload
        commit.mockClear();
        const root = {
            ...rootState,
            baseline: {
                selectedDataset: {
                    id: dataset.id
                }
            }
        };
        const adr = { schemas, datasets: [] }; //do not include datasets in adr state, the action will fetch them
        await adrActions.getUserCanUpload({commit, rootState: root, state: adr} as any);
        expect(commit.mock.calls[0][0]).toBe(`baseline/${BaselineMutation.SetDataset}`);
        expect(commit.mock.calls[1][0].type).toBe(ADRMutation.SetUserCanUpload);
        expect(commit.mock.calls[1][0].payload).toBe(true);
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

    it("hits upload files to adr endpoint and gets appropriate error", async () => {

        const commit = jest.fn();

        // 1. get datasets
        await adrActions.getDatasets({commit, rootState} as any);

        // 2. select a naomi dev dataset
        const datasets = commit.mock.calls[2][0]["payload"];
        const dataset = datasets.find((dataset: any) => dataset.organization.name === "naomi-development-team");

        // 3. check can upload
        commit.mockClear();
        const root = {
            ...rootState,
            baseline: {
                selectedDataset: {
                    id: dataset.id,
                    organization: {id: dataset.organization.id}
                }
            }
        };

        const adr = { schemas, datasets };

        const uploadFilesPayload = [
            {
                resourceType: "type1",
                resourceFilename: "file1",
                resourceId: "id1"
            }
        ] as UploadFile[]

        await adrActions.uploadFilestoADR({commit, state: adr, rootState: root} as any,
            uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[1][0]["type"]).toBe("SetADRUploadError");
        expect(commit.mock.calls[1][0]["payload"]["error"]).toBe("OTHER_ERROR");
    }, 7000);

});
