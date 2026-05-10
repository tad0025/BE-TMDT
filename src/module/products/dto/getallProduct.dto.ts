import { EFilterState } from "../enums/EFilterState.enum";

export class getallProductDto {
    page: number
    pageSize: number
    filters: {
        sortBy: EFilterState;
        categories: string[];
        minPrice: string;
        maxPrice: string;
    }
}