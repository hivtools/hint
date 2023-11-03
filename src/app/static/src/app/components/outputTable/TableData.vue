<template>
    <div>
        <div style="margin: 10px 0;">
            <button @click="exportData">Download CSV export file</button>
        </div>
        <ag-grid-vue
                style="height: 600px"
                class="ag-theme-alpine"
                :defaultColDef="defaultColDef"
                :columnDefs="columnDefs"
                :rowData="rowData"
                :grid-options="gridOptions"
                @grid-ready="onGridReady"
        >
        </ag-grid-vue>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { AgGridEvent } from "ag-grid-community";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-alpine.css";

export default defineComponent({
    name: "TableData",
    components: {
        AgGridVue
    },

    methods: {
        percentGetter(sex: string) {
            return ((params: any) => {
                return this.formatPercent(params.data["prevalence_" + sex])
            })
        },
        percentFormatter(sex: string) {
            return ((params: any) => {
                return params.value + ' (' +
                this.formatPercent(params.data["prevalence_lower_" + sex]) + ' - ' +
                this.formatPercent(params.data["prevalence_upper_" + sex]) + ')'
            })
        },
        formatPercent(value: number) {
            return Math.round(value * 100) / 100
        },
        onGridReady(params: AgGridEvent) {
            this.gridApi = params.api;
        },
        exportData() {
            this.gridApi?.exportDataAsCsv();
        }
    },

    data: function() {
        return {
            columnDefs: [
                {
                    headerName: "Area",
                    field: "areaLabel",
                    filter: 'agTextColumnFilter'
                },
                {
                    headerName: "Both",
                    valueGetter: this.percentGetter('both'),
                    valueFormatter: this.percentFormatter('both'),
                },
                {
                    headerName: "Male",
                    valueGetter: this.percentGetter('male'),
                    valueFormatter: this.percentFormatter('male'),
                },
                {
                    headerName: "Female",
                    valueGetter: this.percentGetter('female'),
                    valueFormatter: this.percentFormatter('female'),
                },
            ],
            gridApi: ref(),
            defaultColDef: {
                filter: 'agNumberColumnFilter',
                floatingFilter: true,
                suppressMenu: true,
                unSortIcon: true,
                sortable: true,
                flex: 1,
                minWidth: 75,
                useValueFormatterForExport: false,
                suppressMovable: true,
            },
            gridOptions: {
                paginationAutoPageSize: true,
                pagination: true
            },
            rowData: [
                {
                    "areaLabel": "Malawi - Demo",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "prevalence_both": 9.255,
                    "prevalence_female": 11.155,
                    "prevalence_male": 7.155,
                    "prevalence_lower_both": 8.7693,
                    "prevalence_lower_female": 10.4693,
                    "prevalence_lower_male": 6.3693,
                    "prevalence_upper_both": 9.7815,
                    "prevalence_upper_female": 11.9815,
                    "prevalence_upper_male": 8.1815
                },
                {
                    "areaLabel": "Northern",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "",
                    "prevalence_both": 6.755,
                    "prevalence_female": 8.155,
                    "prevalence_male": 5.355,
                    "prevalence_lower_both": 6.3693,
                    "prevalence_lower_female": 7.4693,
                    "prevalence_lower_male": 4.6693,
                    "prevalence_upper_both": 7.2815,
                    "prevalence_upper_female": 8.7815,
                    "prevalence_upper_male": 6.1815
                },
                {
                    "areaLabel": "Central",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "",
                    "prevalence_both": 6.155,
                    "prevalence_female": 7.455,
                    "prevalence_male": 4.755,
                    "prevalence_lower_both": 5.7693,
                    "prevalence_lower_female": 6.9693,
                    "prevalence_lower_male": 4.1693,
                    "prevalence_upper_both": 6.5815,
                    "prevalence_upper_female": 8.0815,
                    "prevalence_upper_male": 5.4815
                },
                {
                    "areaLabel": "Southern",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "",
                    "prevalence_both": 13.055,
                    "prevalence_female": 15.555,
                    "prevalence_male": 10.255,
                    "prevalence_lower_both": 12.3693,
                    "prevalence_lower_female": 14.6693,
                    "prevalence_lower_male": 9.0693,
                    "prevalence_upper_both": 13.7815,
                    "prevalence_upper_female": 16.7815,
                    "prevalence_upper_male": 11.6815
                },
                {
                    "areaLabel": "Northern",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern",
                    "prevalence_both": 6.755,
                    "prevalence_female": 8.155,
                    "prevalence_male": 5.355,
                    "prevalence_lower_both": 6.3693,
                    "prevalence_lower_female": 7.4693,
                    "prevalence_lower_male": 4.6693,
                    "prevalence_upper_both": 7.2815,
                    "prevalence_upper_female": 8.7815,
                    "prevalence_upper_male": 6.1815
                },
                {
                    "areaLabel": "Central-East",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central",
                    "prevalence_both": 4.555,
                    "prevalence_female": 5.555,
                    "prevalence_male": 3.655,
                    "prevalence_lower_both": 4.2693,
                    "prevalence_lower_female": 5.0693,
                    "prevalence_lower_male": 3.0693,
                    "prevalence_upper_both": 4.8815,
                    "prevalence_upper_female": 5.9815,
                    "prevalence_upper_male": 4.1815
                },
                {
                    "areaLabel": "Central-West",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central",
                    "prevalence_both": 7.055,
                    "prevalence_female": 8.555,
                    "prevalence_male": 5.455,
                    "prevalence_lower_both": 6.5693,
                    "prevalence_lower_female": 7.9693,
                    "prevalence_lower_male": 4.7693,
                    "prevalence_upper_both": 7.4815,
                    "prevalence_upper_female": 9.1815,
                    "prevalence_upper_male": 6.2815
                },
                {
                    "areaLabel": "South-East",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern",
                    "prevalence_both": 12.355,
                    "prevalence_female": 14.755,
                    "prevalence_male": 9.755,
                    "prevalence_lower_both": 11.6693,
                    "prevalence_lower_female": 13.5693,
                    "prevalence_lower_male": 8.4693,
                    "prevalence_upper_both": 13.0815,
                    "prevalence_upper_female": 16.0815,
                    "prevalence_upper_male": 11.2815
                },
                {
                    "areaLabel": "South-West",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern",
                    "prevalence_both": 13.855,
                    "prevalence_female": 16.655,
                    "prevalence_male": 10.855,
                    "prevalence_lower_both": 13.0693,
                    "prevalence_lower_female": 15.6693,
                    "prevalence_lower_male": 9.6693,
                    "prevalence_upper_both": 14.5815,
                    "prevalence_upper_female": 17.6815,
                    "prevalence_upper_male": 12.1815
                },
                {
                    "areaLabel": "Chitipa",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 4.955,
                    "prevalence_female": 5.955,
                    "prevalence_male": 3.855,
                    "prevalence_lower_both": 4.4693,
                    "prevalence_lower_female": 5.1693,
                    "prevalence_lower_male": 3.0693,
                    "prevalence_upper_both": 5.4815,
                    "prevalence_upper_female": 6.7815,
                    "prevalence_upper_male": 4.5815
                },
                {
                    "areaLabel": "Karonga",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 7.355,
                    "prevalence_female": 8.555,
                    "prevalence_male": 5.955,
                    "prevalence_lower_both": 6.6693,
                    "prevalence_lower_female": 7.5693,
                    "prevalence_lower_male": 5.0693,
                    "prevalence_upper_both": 7.9815,
                    "prevalence_upper_female": 9.5815,
                    "prevalence_upper_male": 6.9815
                },
                {
                    "areaLabel": "Rumphi",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 6.755,
                    "prevalence_female": 7.955,
                    "prevalence_male": 5.455,
                    "prevalence_lower_both": 6.1693,
                    "prevalence_lower_female": 7.0693,
                    "prevalence_lower_male": 4.5693,
                    "prevalence_upper_both": 7.2815,
                    "prevalence_upper_female": 8.8815,
                    "prevalence_upper_male": 6.3815
                },
                {
                    "areaLabel": "Mzimba",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 6.955,
                    "prevalence_female": 8.455,
                    "prevalence_male": 5.355,
                    "prevalence_lower_both": 6.4693,
                    "prevalence_lower_female": 7.6693,
                    "prevalence_lower_male": 4.5693,
                    "prevalence_upper_both": 7.4815,
                    "prevalence_upper_female": 9.1815,
                    "prevalence_upper_male": 6.3815
                },
                {
                    "areaLabel": "Nkhata Bay",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 6.755,
                    "prevalence_female": 8.255,
                    "prevalence_male": 5.255,
                    "prevalence_lower_both": 6.0693,
                    "prevalence_lower_female": 7.1693,
                    "prevalence_lower_male": 4.3693,
                    "prevalence_upper_both": 7.3815,
                    "prevalence_upper_female": 9.1815,
                    "prevalence_upper_male": 6.2815
                },
                {
                    "areaLabel": "Likoma",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Northern/Northern",
                    "prevalence_both": 7.955,
                    "prevalence_female": 9.955,
                    "prevalence_male": 5.955,
                    "prevalence_lower_both": 6.9693,
                    "prevalence_lower_female": 8.4693,
                    "prevalence_lower_male": 4.6693,
                    "prevalence_upper_both": 9.0815,
                    "prevalence_upper_female": 11.4815,
                    "prevalence_upper_male": 7.3815
                },
                {
                    "areaLabel": "Nkhotakota",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-East",
                    "prevalence_both": 6.355,
                    "prevalence_female": 7.555,
                    "prevalence_male": 5.055,
                    "prevalence_lower_both": 5.7693,
                    "prevalence_lower_female": 6.6693,
                    "prevalence_lower_male": 4.2693,
                    "prevalence_upper_both": 6.9815,
                    "prevalence_upper_female": 8.5815,
                    "prevalence_upper_male": 6.0815
                },
                {
                    "areaLabel": "Kasungu",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-East",
                    "prevalence_both": 4.255,
                    "prevalence_female": 5.155,
                    "prevalence_male": 3.355,
                    "prevalence_lower_both": 3.7693,
                    "prevalence_lower_female": 4.4693,
                    "prevalence_lower_male": 2.7693,
                    "prevalence_upper_both": 4.6815,
                    "prevalence_upper_female": 5.7815,
                    "prevalence_upper_male": 3.9815
                },
                {
                    "areaLabel": "Ntchisi",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-East",
                    "prevalence_both": 2.955,
                    "prevalence_female": 3.555,
                    "prevalence_male": 2.255,
                    "prevalence_lower_both": 2.5693,
                    "prevalence_lower_female": 3.0693,
                    "prevalence_lower_male": 1.8693,
                    "prevalence_upper_both": 3.2815,
                    "prevalence_upper_female": 4.0815,
                    "prevalence_upper_male": 2.7815
                },
                {
                    "areaLabel": "Dowa",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-East",
                    "prevalence_both": 3.355,
                    "prevalence_female": 4.155,
                    "prevalence_male": 2.555,
                    "prevalence_lower_both": 2.9693,
                    "prevalence_lower_female": 3.5693,
                    "prevalence_lower_male": 2.0693,
                    "prevalence_upper_both": 3.7815,
                    "prevalence_upper_female": 4.6815,
                    "prevalence_upper_male": 3.0815
                },
                {
                    "areaLabel": "Salima",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-East",
                    "prevalence_both": 6.955,
                    "prevalence_female": 8.255,
                    "prevalence_male": 5.555,
                    "prevalence_lower_both": 6.3693,
                    "prevalence_lower_female": 7.3693,
                    "prevalence_lower_male": 4.6693,
                    "prevalence_upper_both": 7.4815,
                    "prevalence_upper_female": 9.3815,
                    "prevalence_upper_male": 6.5815
                },
                {
                    "areaLabel": "Mchinji",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-West",
                    "prevalence_both": 5.655,
                    "prevalence_female": 6.655,
                    "prevalence_male": 4.655,
                    "prevalence_lower_both": 5.1693,
                    "prevalence_lower_female": 5.8693,
                    "prevalence_lower_male": 3.8693,
                    "prevalence_upper_both": 6.1815,
                    "prevalence_upper_female": 7.4815,
                    "prevalence_upper_male": 5.5815
                },
                {
                    "areaLabel": "Lilongwe",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-West",
                    "prevalence_both": 7.755,
                    "prevalence_female": 9.455,
                    "prevalence_male": 5.955,
                    "prevalence_lower_both": 7.2693,
                    "prevalence_lower_female": 8.7693,
                    "prevalence_lower_male": 5.1693,
                    "prevalence_upper_both": 8.2815,
                    "prevalence_upper_female": 10.1815,
                    "prevalence_upper_male": 6.7815
                },
                {
                    "areaLabel": "Dedza",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-West",
                    "prevalence_both": 4.755,
                    "prevalence_female": 5.755,
                    "prevalence_male": 3.755,
                    "prevalence_lower_both": 4.2693,
                    "prevalence_lower_female": 5.0693,
                    "prevalence_lower_male": 3.0693,
                    "prevalence_upper_both": 5.2815,
                    "prevalence_upper_female": 6.5815,
                    "prevalence_upper_male": 4.4815
                },
                {
                    "areaLabel": "Ntcheu",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Central/Central-West",
                    "prevalence_both": 8.055,
                    "prevalence_female": 9.955,
                    "prevalence_male": 6.155,
                    "prevalence_lower_both": 7.3693,
                    "prevalence_lower_female": 8.8693,
                    "prevalence_lower_male": 5.0693,
                    "prevalence_upper_both": 8.7815,
                    "prevalence_upper_female": 11.0815,
                    "prevalence_upper_male": 7.3815
                },
                {
                    "areaLabel": "Mangochi",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 11.155,
                    "prevalence_female": 13.255,
                    "prevalence_male": 8.855,
                    "prevalence_lower_both": 10.0693,
                    "prevalence_lower_female": 11.7693,
                    "prevalence_lower_male": 7.2693,
                    "prevalence_upper_both": 12.2815,
                    "prevalence_upper_female": 15.0815,
                    "prevalence_upper_male": 10.8815
                },
                {
                    "areaLabel": "Machinga",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 9.355,
                    "prevalence_female": 10.955,
                    "prevalence_male": 7.555,
                    "prevalence_lower_both": 8.5693,
                    "prevalence_lower_female": 9.7693,
                    "prevalence_lower_male": 6.1693,
                    "prevalence_upper_both": 10.1815,
                    "prevalence_upper_female": 12.3815,
                    "prevalence_upper_male": 8.9815
                },
                {
                    "areaLabel": "Balaka",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 10.155,
                    "prevalence_female": 12.255,
                    "prevalence_male": 7.755,
                    "prevalence_lower_both": 9.1693,
                    "prevalence_lower_female": 10.9693,
                    "prevalence_lower_male": 6.4693,
                    "prevalence_upper_both": 11.0815,
                    "prevalence_upper_female": 13.5815,
                    "prevalence_upper_male": 9.0815
                },
                {
                    "areaLabel": "Zomba",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 12.655,
                    "prevalence_female": 15.255,
                    "prevalence_male": 9.655,
                    "prevalence_lower_both": 11.6693,
                    "prevalence_lower_female": 13.8693,
                    "prevalence_lower_male": 8.2693,
                    "prevalence_upper_both": 13.5815,
                    "prevalence_upper_female": 16.6815,
                    "prevalence_upper_male": 11.1815
                },
                {
                    "areaLabel": "Phalombe",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 15.855,
                    "prevalence_female": 18.755,
                    "prevalence_male": 12.655,
                    "prevalence_lower_both": 14.7693,
                    "prevalence_lower_female": 16.8693,
                    "prevalence_lower_male": 10.7693,
                    "prevalence_upper_both": 16.9815,
                    "prevalence_upper_female": 20.5815,
                    "prevalence_upper_male": 14.7815
                },
                {
                    "areaLabel": "Mulanje",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-East",
                    "prevalence_both": 16.055,
                    "prevalence_female": 19.155,
                    "prevalence_male": 12.655,
                    "prevalence_lower_both": 14.9693,
                    "prevalence_lower_female": 17.4693,
                    "prevalence_lower_male": 10.6693,
                    "prevalence_upper_both": 17.1815,
                    "prevalence_upper_female": 21.2815,
                    "prevalence_upper_male": 14.8815
                },
                {
                    "areaLabel": "Neno",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 11.355,
                    "prevalence_female": 13.355,
                    "prevalence_male": 9.255,
                    "prevalence_lower_both": 10.5693,
                    "prevalence_lower_female": 11.9693,
                    "prevalence_lower_male": 7.9693,
                    "prevalence_upper_both": 12.0815,
                    "prevalence_upper_female": 14.6815,
                    "prevalence_upper_male": 10.5815
                },
                {
                    "areaLabel": "Blantyre",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 14.255,
                    "prevalence_female": 17.755,
                    "prevalence_male": 10.755,
                    "prevalence_lower_both": 13.3693,
                    "prevalence_lower_female": 16.5693,
                    "prevalence_lower_male": 9.2693,
                    "prevalence_upper_both": 15.2815,
                    "prevalence_upper_female": 19.0815,
                    "prevalence_upper_male": 12.3815
                },
                {
                    "areaLabel": "Mwanza",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 9.055,
                    "prevalence_female": 10.855,
                    "prevalence_male": 7.055,
                    "prevalence_lower_both": 8.1693,
                    "prevalence_lower_female": 9.5693,
                    "prevalence_lower_male": 5.8693,
                    "prevalence_upper_both": 9.9815,
                    "prevalence_upper_female": 12.2815,
                    "prevalence_upper_male": 8.3815
                },
                {
                    "areaLabel": "Chiradzulu",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 18.655,
                    "prevalence_female": 22.055,
                    "prevalence_male": 14.755,
                    "prevalence_lower_both": 17.7693,
                    "prevalence_lower_female": 20.6693,
                    "prevalence_lower_male": 13.1693,
                    "prevalence_upper_both": 19.3815,
                    "prevalence_upper_female": 23.5815,
                    "prevalence_upper_male": 16.3815
                },
                {
                    "areaLabel": "Thyolo",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 13.955,
                    "prevalence_female": 15.855,
                    "prevalence_male": 11.655,
                    "prevalence_lower_both": 12.9693,
                    "prevalence_lower_female": 14.5693,
                    "prevalence_lower_male": 10.2693,
                    "prevalence_upper_both": 14.8815,
                    "prevalence_upper_female": 17.3815,
                    "prevalence_upper_male": 13.2815
                },
                {
                    "areaLabel": "Chikwawa",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 10.855,
                    "prevalence_female": 13.155,
                    "prevalence_male": 8.555,
                    "prevalence_lower_both": 9.9693,
                    "prevalence_lower_female": 11.8693,
                    "prevalence_lower_male": 6.9693,
                    "prevalence_upper_both": 11.8815,
                    "prevalence_upper_female": 14.4815,
                    "prevalence_upper_male": 10.2815
                },
                {
                    "areaLabel": "Nsanje",
                    "quarter": "September 2018",
                    "age": "15-49",
                    "areaHierarchy": "Southern/South-West",
                    "prevalence_both": 14.455,
                    "prevalence_female": 16.855,
                    "prevalence_male": 11.655,
                    "prevalence_lower_both": 13.6693,
                    "prevalence_lower_female": 15.1693,
                    "prevalence_lower_male": 9.9693,
                    "prevalence_upper_both": 15.3815,
                    "prevalence_upper_female": 18.6815,
                    "prevalence_upper_male": 13.6815
                }
            ] as any
        }
    }
});
</script>
