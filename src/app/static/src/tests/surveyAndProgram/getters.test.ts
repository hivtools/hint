import {DataType, SurveyAndProgramState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {getters} from "../../app/store/surveyAndProgram/getters";
import {mockAncResponse, mockError, mockProgramResponse, mockSurveyAndProgramState, mockSurveyResponse} from "../mocks";

describe("survey and program getters", () => {

    const getTestState = function (values: Partial<SurveyAndProgramState> = {}) {
        return mockSurveyAndProgramState(
            {
                survey: mockSurveyResponse({
                    data: "SURVEY" as any,
                    filters: {year: ["Survey year"], age: ["Survey age"], surveys: ["Survey survey"]} as any
                }),
                program: mockProgramResponse({
                    data: "PROGRAM" as any,
                    filters: {year: ["Program year"], age: ["Program age"]} as any
                }),
                anc: mockAncResponse({
                    data: "ANC" as any,
                    filters: {year: ["ANC year"], age: ["ANC age"]} as any
                }),
                ...values
            });
    };

    const testRootState = {
        baseline: {
            shape: {
                filters: {
                    regions: {children: ["REGION OPTIONS"]}
                }
            }
        }
    };

    const testExpectedFilters = function (dataType: DataType, shouldIncludeSexOptions: boolean) {
        const testState = getTestState({selectedDataType: dataType});

        const filters = getters.filters(testState, null, testRootState as any);
        expect(filters.length).toBe(6);
        expect(filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: ["REGION OPTIONS"]
        });
        expect(filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: [`${DataType[dataType]} year`]
        });

        expect(filters[2]).toStrictEqual({
            id: "calendar_quarter",
            column_id: "calendar_quarter",
            label: "calendar",
            allowMultiple: false,
            options: []
        });

        const countryAreaFilterOption = getters.countryAreaFilterOption(testState, null, testRootState as any);
        expect(countryAreaFilterOption).toStrictEqual({children: ["REGION OPTIONS"]});

        const sexFilterOptions = shouldIncludeSexOptions ?
            [{id: "both", label: "both"}, {id: "female", label: "female"}, {id: "male", label: "male"}] : [];
        expect(filters[3]).toStrictEqual({
            id: "sex",
            column_id: "sex",
            label: "sex",
            allowMultiple: false,
            options: sexFilterOptions
        });

        expect(filters[4]).toStrictEqual({
            id: "age",
            column_id: "age_group",
            label: "age",
            allowMultiple: false,
            options: [`${DataType[dataType]} age`]
        });

        const surveyOptions = dataType == DataType.Survey ? [`Survey survey`] : [];
        expect(filters[5]).toStrictEqual({
            id: "survey",
            column_id: "survey_id",
            label: "survey",
            allowMultiple: false,
            options: surveyOptions
        });
    };

    it("gets data when selectedDataType is Survey", () => {
        const testState = getTestState({selectedDataType: DataType.Survey});

        const data = getters.data(testState);
        expect(data).toStrictEqual("SURVEY");
    });

    it("gets data when selectedDataType is Program", () => {
        const testState = getTestState({selectedDataType: DataType.Program});

        const data = getters.data(testState);
        expect(data).toStrictEqual("PROGRAM");
    });

    it("gets data when selectedDataType is ANC", () => {
        const testState = getTestState({selectedDataType: DataType.ANC});

        const data = getters.data(testState);
        expect(data).toStrictEqual("ANC");
    });

    it("gets data when selectedDataType is unknown", () => {
        const testState = getTestState({selectedDataType: 99 as DataType});

        const data = getters.data(testState);
        expect(data).toBeNull()
    });

    it("is not complete if missing survey", () => {
        expect(getters.complete(mockSurveyAndProgramState())).toBe(false);
    });

    it("is not complete if has a program error", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            programError: mockError("something")
        }))).toBe(false);
    });

    it("is not complete if has an ANC error", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            ancError: mockError("something")
        }))).toBe(false);
    });

    it("is complete if has survey and no errors", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        }))).toBe(true);
    });

    it("has changes if has changes to either survey or program or anc", () => {
        expect(getters.hasChanges(mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        }))).toBe(true);
        expect(getters.hasChanges(mockSurveyAndProgramState({
            program: mockProgramResponse()
        }))).toBe(true);
        expect(getters.hasChanges(mockSurveyAndProgramState({
            anc: mockAncResponse()
        }))).toBe(true);
    });

    it("gets filters when selectedDataType is null", () => {
        const testState = getTestState({selectedDataType: null});

        const filters = getters.filters(testState, null, testRootState as any);
        expect(filters).toStrictEqual([]);
    });

    it("gets filters when selectedDataType is Survey", () => {
        testExpectedFilters(DataType.Survey, true);
    });

    it("gets filters when selectedDataType is Program", () => {
        testExpectedFilters(DataType.Program, true);
    });

    it("gets filters when selectedDataType is ANC", () => {
        testExpectedFilters(DataType.ANC, false);
    });


});
