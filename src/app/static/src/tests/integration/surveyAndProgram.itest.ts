import {actions} from "../../app/store/surveyAndProgram/actions";
import {actions as baselineActions} from "../../app/store/baseline/actions"
import {login} from "./integrationTest";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    beforeAll(async () => {
        await login();

        const commit = jest.fn();
        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);

        await baselineActions.uploadShape({commit} as any, formData);
    });

    it("can upload survey", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/survey.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadSurvey({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("SurveyUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("3C8D2C858C3C9F56AA7FF2693C32A821.csv")

    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/programme.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ProgramUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("1031AFC6C38340870E7E1561C1A8F70A.csv")
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/anc.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ANCUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("7E326D1FAEBD08A122563B47410C3BCB.csv")

    });


});
