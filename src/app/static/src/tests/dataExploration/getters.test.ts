import {getters} from "../../app/store/dataExploration/getters";
import {
    mockBaselineState,
    mockDataExplorationState,
    mockError,
    mockSurveyAndProgramState
} from "../mocks";
import {extractErrors} from "../../app/utils";
import {DataExplorationState} from "../../app/store/dataExploration/dataExploration";
import {expectArraysEqual} from "../testHelpers";

describe(`data exploration getters`, () => {

    function getResult(state: Partial<DataExplorationState>) {
        return getters.errors(mockDataExplorationState(state),
            null as any,
            null as any,
            null as any);
    }

    it(`isGuest returns true if user is guest`, () => {
        const state = mockDataExplorationState({currentUser: "guest"})
        const getter = getters.isGuest(state, null, null as any, null)
        expect(getter).toBe(true)
    })

    it(`isGuest returns false if user is not guest`, () => {
        const state = mockDataExplorationState({currentUser: "user"})
        const getter = getters.isGuest(state, null, null as any, null)
        expect(getter).toBe(false)
    })

    it("gets errors from multiple modules", async () => {
        const surveyErr = mockError("survey");
        const shapeErr = mockError("shape");

        const result = getResult({
            surveyAndProgram: mockSurveyAndProgramState({
                surveyError: surveyErr
            }),
            baseline: mockBaselineState({
                shapeError: shapeErr
            })
        });
        expectArraysEqual(result, [surveyErr, shapeErr]);
    });

    it("can extract top level errors", () => {
        const test = {
            error: mockError("e1")
        }

        expect(extractErrors(test)).toEqual([mockError("e1")])
    });

    it("can extract nested errors", () => {
        const test = {
            something: {
                error: mockError("e1")
            }
        }

        expect(extractErrors(test)).toEqual([mockError("e1")])
    });

    it("is case insensitive", () => {
        const test = {
            something: {
                anError: mockError("e1"),
                anothererror: mockError("e2")
            }
        }

        expect(extractErrors(test)).toEqual([mockError("e1"), mockError("e2")])
    });

    it("only matches words ending in 'error'", () => {
        const test = {
            something: {
                anError: mockError("e1"),
                shapeErroredFile: "notanerror",
                randomProp: "alsonotanerror"
            }
        }

        expect(extractErrors(test)).toEqual([mockError("e1")])
    });

    it("omits nulls", () => {
        const test = {
            something: {
                anError: null
            }
        }
        expect(extractErrors(test)).toEqual([])
    });
});