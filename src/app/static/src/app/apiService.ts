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

declare var appUrl: string;

export class APIService {

    // appUrl var should be set externally in the browser
    baseUrl = typeof appUrl !== "undefined" ? appUrl: "";

    buildFullUrl = (url: string) => {
        return this.baseUrl + url
    };

    get<T extends ResponseData>(url: string) {
        const fullUrl = this.buildFullUrl(url);
        console.log(`GET ${fullUrl}`);
        return axios.get(fullUrl)
            .then((response: AxiosResponse<Success>) => {
                const payload = response && response.data;
                return payload.data as T
            })
            .catch((e: AxiosError<Failure>) => {
                return this.handleError(e)
            })
    }

    postAndReturn<T extends ResponseData>(url: string, data: any) {
        const fullUrl = this.buildFullUrl(url);
        console.log(`POST ${fullUrl}`);
        return axios.post(fullUrl, data)
            .then((response: AxiosResponse<Success>) => {
                const payload = response && response.data;
                return payload.data as T
            })
            .catch((e: AxiosError<Failure>) => {
                console.log(e)
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