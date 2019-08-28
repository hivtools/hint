import axios, {AxiosError, AxiosResponse} from "axios";
import {InternalResponse} from "./types";
import {
    Failure,
    InitialiseModelRunResponse,
    ModelRunResultResponse,
    Success,
    ValidateInputResponse
} from "./generated";

type ResponseData = ValidateInputResponse | ModelRunResultResponse | InitialiseModelRunResponse | InternalResponse | null

export class APIService {

    get<T extends ResponseData>(url: string) {
        return axios.get(url)
            .then((response: AxiosResponse<Success>) => {
                const payload = response && response.data;
                return payload.data as T
            })
            .catch((e: AxiosError<Failure>) => {
                return this.handleError(e)
            })
    }

    postAndReturn<T extends ResponseData>(url: string, data: any) {
        return axios.post(url, data)
            .then((response: AxiosResponse<Success>) => {
                const payload = response && response.data;
                return payload.data as T
            })
            .catch((e: AxiosError<Failure>) => {
               return this.handleError(e)
            });
    }

    handleError = (e: AxiosError<Failure>) => {
        const failure = e.response!.data;
        console.log(failure.errors);
        throw new Error((failure.errors[0] && failure.errors[0].detail) ?
            failure.errors[0].detail : "Something went wrong")
    };

    doNothing = () => {}
}

export const api = new APIService();