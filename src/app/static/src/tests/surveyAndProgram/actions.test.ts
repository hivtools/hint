import {actions} from "../../app/store/surveyAndProgram/actions";
import {mockAxios} from "../mocks";
import {Failure, Success} from "../../app/generated";

describe("Survey and program actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("sets data after survey file upload", (done) => {

        mockAxios.onPost(`/survey/`)
            .reply(200, {data: {data: {geoJson: "SOME GEOJSON"}}});

        const commit = jest.fn();
        actions.uploadSurvey({commit} as any, {} as File);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "SurveyLoaded",
                payload: {data: {geoJson: "SOME GEOJSON"}}
            });
            done();
        })
    });

    it("sets error message after failed survey upload", (done) => {

        mockAxios.onPost(`/survey/`)
            .reply(500, {errors: [{error: "OTHER_ERROR", detail: "error message"}]} as Partial<Failure>);

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