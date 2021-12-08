import {baselineGetters} from "../../app/store/baseline/baseline";
import {mockBaselineState, mockError, mockPopulationResponse, mockShapeResponse} from "../mocks";

it("is complete iff all files are present", () => {
    let state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(true);

    state = mockBaselineState({
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);
});

it("is valid for data exploration iff consistent, no errors, and shape file is present", () => {
    let state = mockBaselineState({
        shape: mockShapeResponse(),
        validatedConsistent: true
    });
    expect(baselineGetters.validForDataExploration(state)).toBe(true);

    state = mockBaselineState({
        pjnzError: mockError(""),
        shape: mockShapeResponse(),
        validatedConsistent: true
    });
    expect(baselineGetters.validForDataExploration(state)).toBe(false);

    state = mockBaselineState({
        populationError: mockError(""),
        shape: mockShapeResponse(),
        validatedConsistent: true
    });
    expect(baselineGetters.validForDataExploration(state)).toBe(false);

    state = mockBaselineState({validatedConsistent: true});
    expect(baselineGetters.validForDataExploration(state)).toBe(false);

    state = mockBaselineState({
        shape: mockShapeResponse(),
        validatedConsistent: false
    });
    expect(baselineGetters.validForDataExploration(state)).toBe(false);
});
