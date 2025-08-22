import {actions} from "../../../app/store/reviewInput/actions";
import {login, rootState} from "../integrationTest";
import {ReviewInputDataset} from "../../../app/types";
import {ReviewInputMutation} from "../../../app/store/reviewInput/mutations";
import {getFormData} from "../helpers";
import {actions as baselineActions} from "../../../app/store/baseline/actions";
import {actions as sapActions} from "../../../app/store/surveyAndProgram/actions"

describe("reviewInput actions", () => {
    beforeAll(async () => {
        await login();
    });

    const uploadInputFiles = async() => {
        const commit = vi.fn();
        const dispatch = vi.fn();
        const shapeFormData = getFormData("malawi.geojson");
        await baselineActions.uploadShape({commit, dispatch, rootState} as any, shapeFormData);
        const pjnzFormData = getFormData("Malawi2024.PJNZ");
        await baselineActions.uploadPJNZ({commit, dispatch, rootState} as any, pjnzFormData);
        const ancFormData = getFormData("anc.csv");
        await sapActions.uploadANC({commit, dispatch, rootState} as any, ancFormData);
        const artFormData = getFormData("programme.csv")
        await sapActions.uploadProgram({commit, dispatch, rootState} as any, artFormData);
    };

    it("can fetch dataset", async () => {
        await uploadInputFiles();
        const commit = vi.fn();
        const payload = {datasetId: "ART", url: "/chart-data/input-time-series/programme"};
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls[1][0]["type"]).toBe(ReviewInputMutation.SetDataset);
        const response = commit.mock.calls[1][0]["payload"]["dataset"] as ReviewInputDataset;
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data[0].area_id).toContain("MWI");
        expect(response.data[0].value).not.toBeUndefined();
    });
});
