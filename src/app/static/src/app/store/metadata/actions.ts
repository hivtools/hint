import {ActionContext, ActionTree} from 'vuex';
import {api} from "../../apiService";
import {MetadataState} from "./metadata";
import {MetadataMutations} from "./mutations";
import { FileType } from '../surveyAndProgram/surveyAndProgram';
import { commitPlotDefaultSelections, filtersAfterUseShapeRegions } from '../plotSelections/utils';
import { ReviewInputFilterMetadataResponse } from '../../generated';
import { RootState } from '../../root';
import { commitInitialScaleSelections } from '../plotState/utils';
import { GenericChartMutation } from '../genericChart/mutations';

export interface MetadataActions {
    getReviewInputMetadata: (store: ActionContext<MetadataState, RootState>) => void
    getAdrUploadMetadata: (store: ActionContext<MetadataState, RootState>, downloadId: string) => Promise<void>
}

export const actions: ActionTree<MetadataState, RootState> & MetadataActions = {

    async getReviewInputMetadata(context) {
        const { commit, rootState } = context;
        const iso3 = rootState.baseline.iso3;
        const sap = rootState.surveyAndProgram;
        const fileTypes = [FileType.Shape]
        if (!sap.ancError && sap.anc) {
            fileTypes.push(FileType.ANC);
        }
        if (!sap.programError && sap.program) {
            fileTypes.push(FileType.Programme);
        }
        if (!sap.surveyError && sap.survey) {
            fileTypes.push(FileType.Survey);
        }
        commit(`genericChart/${GenericChartMutation.SetLoading}`, {payload: true}, {root:true});
        const response = await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.ReviewInputsMetadataFetched) 
            .withError(MetadataMutations.ReviewInputsMetadataError)
            .postAndReturn<ReviewInputFilterMetadataResponse>(`/meta/review-inputs/${iso3}`, { types: fileTypes });
        if (response) {
            const metadata = response.data;
            metadata.filterTypes = filtersAfterUseShapeRegions(metadata.filterTypes, rootState);
            await commitPlotDefaultSelections(metadata, commit, rootState);
            commitInitialScaleSelections(metadata.indicators, commit);
        }
        commit(`genericChart/${GenericChartMutation.SetLoading}`, {payload: false}, {root: true});
    },

    async getAdrUploadMetadata(context, downloadId) {
        await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.AdrUploadMetadataFetched)
            .withError(MetadataMutations.AdrUploadMetadataError)
            .get(`/meta/adr/${downloadId}`)
    }
};
