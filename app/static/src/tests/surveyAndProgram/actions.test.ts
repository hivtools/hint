import {actions} from "../../app/store/surveyAndProgram/actions";
import {mockAxios} from "../mocks";

describe("Survey and program actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("sets data after survey file upload", (done) => {

        mockAxios.onPost(`/survey/upload`)
            .reply(200, "SOME GEOJSON");

        const commit = jest.fn();
        actions.uploadSurvey({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "SurveyLoaded", payload: "SOME GEOJSON"});
            done();
        })
    });

    it("sets error message after failed survey upload", (done) => {

        mockAxios.onPost(`/survey/upload`)
            .reply(500, {error: "Something went wrong", status: 500, message: "error message"});

        const commit = jest.fn();
        actions.uploadSurvey({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "SurveyError",
                payload: "error message"
            });
            done();
        })
    });

});