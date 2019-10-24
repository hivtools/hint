import {NestedFilterOption} from "../../../app/generated";
import {flattenOptions, getUnfilteredData} from "../../../app/store/filteredData/utils";
import {Module} from "vuex";
import {DataType, FilteredDataState, initialFilteredDataState} from "../../../app/store/filteredData/filteredData";
import {RootState} from "../../../app/root";
import {
    mockAncResponse,
    mockModelResultResponse,
    mockModelRunState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";

describe("filtered data utils", () => {
    it("can flatten options", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", label: "name1", children: [{
                    id: "2", label: "nested", children: []
                }]
            }
        ];

        const result = flattenOptions(testData);
        expect(result["1"]).toStrictEqual({id: "1", label: "name1"});
        expect(result["2"]).toStrictEqual({id: "2", label: "nested"});
    });

    const testRootState =
        mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: "SURVEY" as any}
                    ),
                    program: mockProgramResponse(
                        {data: "PROGRAM" as any}
                    ),
                    anc: mockAncResponse(
                        {data: "ANC" as any}
                    )
                }),
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {data: "OUTPUT" as any}
                    )
                })
        });


    it("gets unfilteredData when selectedDataType is Survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey}
        };
        const testState = testStore.state as FilteredDataState;

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("SURVEY");
    });

    it("gets unfilteredData when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
        };
        const testState = testStore.state as FilteredDataState;

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("PROGRAM");
    });

    it("gets unfilteredData when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC}
        };
        const testState = testStore.state as FilteredDataState;

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("ANC");
    });

    it("gets unfilteredData when selectedDataType is Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Output}
        };
        const testState = testStore.state as FilteredDataState;

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("OUTPUT");
    });


    it("gets unfilteredData when selectedDataType is unknown", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: 99 as DataType.Output}
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState();

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toBeNull();
    });

});
