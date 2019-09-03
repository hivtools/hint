import {mockAxios, mockFailure, mockShapeResponse, mockSuccess} from "../mocks";
import {actions} from "../../app/store/baseline/actions";
import {testUploadComponent} from "../components/surveyAndProgram/fileUploads";
import {testUploadErrorCommitted} from "../actionTestHelpers";

const FormData = require("form-data");

describe("Baseline actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets country after PJNZ file upload", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}}));

        const commit = jest.fn();
        await actions.uploadPJNZ({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUploaded", payload: {data: {country: "Malawi"}}});
    });

    testUploadErrorCommitted("/baseline/pjnz/", "PJNZUploadError", actions.uploadPJNZ);

    it("commits response after shape file upload", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        await actions.uploadShape({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ShapeUploaded",
            payload: mockShape
        });
    });

    testUploadErrorCommitted("/baseline/shape/", "ShapeUploadError", actions.uploadShape);

    it("gets baseline data and commits it", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}, filename: "test.pjnz"}));

        mockAxios.onGet(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PJNZLoaded",
            payload: {data: {country: "Malawi"}, filename: "test.pjnz"}
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ShapeUploaded",
            payload: mockShape
        });
    });

    it("fails silently if getting baseline data fails", async () => {

        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(500);

        mockAxios.onGet(`/baseline/shape/`)
            .reply(500);

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        expect(commit).toBeCalledTimes(0);
    });

});