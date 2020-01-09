import {colorFunctionFromName, getColor} from "../../../app/components/plots/utils";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";

it("colorFunctionFromName returns color function", () => {
    const result = colorFunctionFromName("interpolateMagma");
    expect(result).toBe(interpolateMagma);
});

it("colorFunctionFromName returns default color function if named function does not exist", () => {
    const result = colorFunctionFromName("not-a-color-function");
    expect(result).toBe(interpolateWarm);
});

it("getColor calculates colour string", () => {
    const result = getColor(0.5, {
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    });

    expect(result).toEqual("rgb(151, 151, 151)");
});

it("getColor avoids dividing by zero if min equals max", () => {
    const result = getColor(0.5, {
        min: 0.5,
        max: 0.5,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    });

    expect(result).toEqual("rgb(255, 255, 255)");
});

it("getColor can invert color function", () => {
    const result = getColor(0, {
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    });
    expect(result).toEqual("rgb(255, 255, 255)"); //0 = white in interpolateGreys

    const invertedResult = getColor(0, {
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: true,
        indicator: "test",
        value_column: "",
        name: ""
    });
    expect(invertedResult).toEqual("rgb(0, 0, 0)");
});

it("getColor can use custom min and max", () => {
    const result = getColor(0.5, {
        min: 0.2,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    }, 0, 1);

    expect(result).toEqual("rgb(151, 151, 151)");
});