import {Mutation, MutationTree} from "vuex";
import {ColourScaleSelections, ColourScalesState} from "./colourScales";
import {PayloadWithType} from "../../types";
import {DataType} from "../surveyAndProgram/surveyAndProgram";

type ColourScalesMutation = Mutation<ColourScalesState>

export interface ColourScalesMutations {
    UpdateSAPColourScales: ColourScalesMutation
}

export const mutations: MutationTree<ColourScalesState> & ColourScalesMutations = {
    UpdateSAPColourScales(state: ColourScalesState, action: PayloadWithType<[DataType, ColourScaleSelections]>) {
        const value = action.payload[1];
        switch(action.payload[0]) {
            case DataType.Survey:
                state.survey = value;
                break;
            case DataType.ANC:
                state.anc = value;
                break;
            case DataType.Program:
                state.program = value;
                break;
            default:

        }
    }
};